package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.request.ProjectTaskBoardRequest;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * 项目任务敏捷面板查询服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskBoardQueryService {
    /**
     * 敏捷面板状态编码集合。
     */
    private static final Set<String> BOARD_STATUS_CODE_SET = Set.of(
            "todo",
            "inProgress",
            "pendingTest",
            "pendingRelease",
            "done");

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 任务详情组装服务。
     */
    private final ProjectTaskViewAssembler projectTaskViewAssembler;

    /**
     * 任务迭代服务。
     */
    private final TaskIterationService taskIterationService;

    /**
     * 获取兼容旧行为的敏捷面板任务列表。
     *
     * @param request 列表请求
     * @return 任务列表
     */
    public List<ProjectTaskDetailVo> getBoard(ProjectTaskBoardRequest request) {
        List<ProjectTask> tasks = queryBoardTasks(request);
        return projectTaskViewAssembler.toTaskVoList(tasks);
    }

    /**
     * 获取敏捷面板专用任务列表。
     *
     * @param request 列表请求
     * @return 按优先级排序后的任务列表
     */
    public List<ProjectTaskDetailVo> getAgileBoard(ProjectTaskBoardRequest request) {
        List<ProjectTask> tasks = queryBoardTasks(request);
        List<ProjectTask> sortedTasks = tasks.stream()
                .sorted(buildAgileBoardComparator())
                .toList();
        return projectTaskViewAssembler.toTaskVoList(sortedTasks);
    }

    /**
     * 查询敏捷面板任务列表。
     *
     * @param request 列表请求
     * @return 任务实体列表
     */
    private List<ProjectTask> queryBoardTasks(ProjectTaskBoardRequest request) {
        Long tenantId = requireCurrentTenantId();
        List<Long> projectIds = resolveProjectIds(request.getProjectId(), tenantId);
        if (projectIds.isEmpty()) {
            return Collections.emptyList();
        }

        String title = normalizeKeyword(request.getTitle());
        String priority = normalizeValue(request.getPriority());
        Long iterationId = taskIterationService.validateIterationId(
                request.getIterationId()
        );
        return projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getProjectId, projectIds)
                .eq(ProjectTask::getDeleted, 0)
                .eq(iterationId != null, ProjectTask::getIterationId, iterationId)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(request.getAssigneeId() != null, ProjectTask::getAssigneeId, request.getAssigneeId())
                .in(ProjectTask::getStatus, BOARD_STATUS_CODE_SET)
                .orderByDesc(ProjectTask::getUpdateTime));
    }

    /**
     * 解析查询项目范围。
     *
     * @param projectId 指定项目 ID
     * @param tenantId  当前租户 ID
     * @return 项目 ID 列表
     */
    private List<Long> resolveProjectIds(Long projectId, Long tenantId) {
        if (projectId != null) {
            projectService.requireProject(projectId);
            return List.of(projectId);
        }

        List<Project> projects = projectMapper.selectList(new LambdaQueryWrapper<Project>()
                .select(Project::getId)
                .eq(Project::getTenantId, tenantId)
                .eq(Project::getDeleted, 0));
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }
        return projects.stream().map(Project::getId).toList();
    }

    /**
     * 构建敏捷面板专用排序比较器。
     *
     * @return 排序比较器
     */
    private Comparator<ProjectTask> buildAgileBoardComparator() {
        return Comparator.comparingInt((ProjectTask task) -> getPriorityRank(task.getPriority()))
                .reversed()
                .thenComparing(ProjectTask::getUpdateTime, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ProjectTask::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    /**
     * 获取优先级权重值。
     *
     * @param priority 优先级
     * @return 权重值
     */
    private int getPriorityRank(String priority) {
        if ("high".equals(priority)) {
            return 3;
        }
        if ("medium".equals(priority)) {
            return 2;
        }
        if ("low".equals(priority)) {
            return 1;
        }
        return 0;
    }

    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前租户 ID
     */
    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }

    /**
     * 规范化关键词筛选值。
     *
     * @param value 原始关键词
     * @return 规范化后的关键词
     */
    private String normalizeKeyword(String value) {
        if (value == null) {
            return null;
        }
        String trimmedValue = value.trim();
        if (!StringUtils.hasText(trimmedValue)) {
            return null;
        }
        return trimmedValue;
    }

    /**
     * 规范化通用字符串值。
     *
     * @param value 原始值
     * @return 去除首尾空格后的值
     */
    private String normalizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }
}
