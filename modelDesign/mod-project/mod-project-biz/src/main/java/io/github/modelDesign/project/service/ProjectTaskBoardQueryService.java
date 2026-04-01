package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.request.ProjectTaskBoardRequest;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目任务敏捷面板查询服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskBoardQueryService {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 获取兼容旧行为的敏捷面板任务列表。
     *
     * @param request 列表请求
     * @return 任务列表
     */
    public List<ProjectTaskDetailVo> getBoard(ProjectTaskBoardRequest request) {
        List<ProjectTask> tasks = queryBoardTasks(request);
        return toTaskVoList(tasks);
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
        return toTaskVoList(sortedTasks);
    }

    /**
     * 查询敏捷面板任务列表。
     *
     * @param request 列表请求
     * @return 任务实体列表
     */
    private List<ProjectTask> queryBoardTasks(ProjectTaskBoardRequest request) {
        if (request.getProjectId() != null) {
            projectService.requireProject(request.getProjectId());
        }
        String title = normalizeKeyword(request.getTitle());
        String priority = normalizeValue(request.getPriority());
        return projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(request.getProjectId() != null, ProjectTask::getProjectId, request.getProjectId())
                .eq(ProjectTask::getDeleted, 0)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(request.getAssigneeId() != null, ProjectTask::getAssigneeId, request.getAssigneeId())
                .in(ProjectTask::getStatus, BOARD_STATUS_CODE_SET)
                .orderByDesc(ProjectTask::getUpdateTime));
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
     * 批量转换任务详情视图对象列表。
     *
     * @param tasks 任务实体列表
     * @return 任务详情视图对象列表
     */
    private List<ProjectTaskDetailVo> toTaskVoList(List<ProjectTask> tasks) {
        Set<Long> userIds = new HashSet<>();
        Set<Long> projectIds = new HashSet<>();
        for (ProjectTask task : tasks) {
            if (task.getCreatorId() != null) {
                userIds.add(task.getCreatorId());
            }
            if (task.getAssigneeId() != null) {
                userIds.add(task.getAssigneeId());
            }
            if (task.getProjectId() != null) {
                projectIds.add(task.getProjectId());
            }
        }
        Map<Long, AuthUserSimpleDto> userMap = getUserMap(userIds);
        Map<Long, String> projectNameMap = getProjectNameMap(projectIds);
        return tasks.stream()
                .map(task -> toTaskVo(task, userMap, projectNameMap))
                .toList();
    }

    /**
     * 批量获取用户信息映射。
     *
     * @param userIds 用户 ID 集合
     * @return 用户 ID 到用户信息的映射
     */
    private Map<Long, AuthUserSimpleDto> getUserMap(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(userIds);
    }

    /**
     * 批量获取项目名称映射。
     *
     * @param projectIds 项目 ID 集合
     * @return 项目 ID 到项目名称的映射
     */
    private Map<Long, String> getProjectNameMap(Set<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return projectMapper.selectBatchIds(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Project::getName, (left, right) -> left));
    }

    /**
     * 转换单个任务详情视图对象。
     *
     * @param task 任务实体
     * @param userMap 用户信息映射
     * @param projectNameMap 项目名称映射
     * @return 任务详情视图对象
     */
    private ProjectTaskDetailVo toTaskVo(
            ProjectTask task,
            Map<Long, AuthUserSimpleDto> userMap,
            Map<Long, String> projectNameMap) {
        String creator = "";
        AuthUserSimpleDto creatorUser = userMap.get(task.getCreatorId());
        if (creatorUser != null && creatorUser.getNickname() != null) {
            creator = creatorUser.getNickname();
        }
        String assignee = "";
        AuthUserSimpleDto assigneeUser = userMap.get(task.getAssigneeId());
        if (assigneeUser != null && assigneeUser.getNickname() != null) {
            assignee = assigneeUser.getNickname();
        }
        return ProjectTaskDetailVo.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .workDays(task.getWorkDays())
                .assigneeId(task.getAssigneeId())
                .assignee(assignee)
                .creatorId(task.getCreatorId())
                .creator(creator)
                .startTime(formatDateTime(task.getStartTime()))
                .dueTime(formatDateTime(task.getDueTime()))
                .createdAt(formatDateTime(task.getCreateTime()))
                .updatedAt(formatDateTime(task.getUpdateTime()))
                .build();
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

    /**
     * 格式化时间为字符串。
     *
     * @param value 时间值
     * @return 格式化后的时间字符串
     */
    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
