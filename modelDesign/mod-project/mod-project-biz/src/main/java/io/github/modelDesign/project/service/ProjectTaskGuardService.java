package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectMember;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import io.github.modelDesign.project.mapper.ProjectMemberMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 任务写入规则校验服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskGuardService {
    /**
     * 可用优先级集合。
     */
    private static final Set<String> VALID_PRIORITY_SET = Set.of("low", "medium", "high");

    /**
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目成员 Mapper。
     */
    private final ProjectMemberMapper projectMemberMapper;

    /**
     * 项目任务成员 Mapper。
     */
    private final ProjectTaskMemberMapper projectTaskMemberMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 校验任务状态并返回标准编码。
     *
     * @param status 任务状态
     * @return 规范化状态编码
     */
    public String validateStatus(String status) {
        return taskStatusConfigService.normalizeAndRequireStatusCode(status);
    }

    /**
     * 校验任务优先级是否合法。
     *
     * @param priority 任务优先级
     */
    public void validatePriority(String priority) {
        String value = normalizeValue(priority);
        if (!StringUtils.hasText(value) || !VALID_PRIORITY_SET.contains(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务优先级不合法");
        }
    }

    /**
     * 校验预计工时是否合法。
     *
     * @param workDays 预计工时
     */
    public void validateWorkDays(BigDecimal workDays) {
        if (workDays == null) {
            return;
        }
        if (workDays.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "预计工时必须大于 0");
        }
        BigDecimal multipliedValue = workDays.multiply(BigDecimal.valueOf(2));
        if (multipliedValue.stripTrailingZeros().scale() > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "预计工时必须按 0.5 人天递增");
        }
    }

    /**
     * 校验任务时间范围是否合法。
     *
     * @param startTime 开始时间
     * @param dueTime   截止时间
     */
    public void validateTimeRange(LocalDateTime startTime, LocalDateTime dueTime) {
        if (startTime == null || dueTime == null) {
            return;
        }
        if (startTime.isAfter(dueTime)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "开始时间不能晚于截止时间");
        }
    }

    /**
     * 校验负责人是否存在。
     *
     * @param assigneeId 负责人 ID
     */
    public void validateAssignee(Long assigneeId) {
        if (assigneeId == null || assigneeId.equals(0L)) {
            return;
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(Set.of(assigneeId));
        if (!userMap.containsKey(assigneeId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "负责人不存在");
        }
    }

    /**
     * 确保负责人已加入项目成员。
     *
     * @param projectId  项目 ID
     * @param assigneeId 负责人 ID
     */
    public void ensureProjectMember(Long projectId, Long assigneeId) {
        if (assigneeId == null || assigneeId.equals(0L)) {
            return;
        }
        ProjectMember member = projectMemberMapper.selectOne(new LambdaQueryWrapper<ProjectMember>()
                .eq(ProjectMember::getProjectId, projectId)
                .eq(ProjectMember::getUserId, assigneeId)
                .last("limit 1"));
        if (member != null) {
            return;
        }
        ProjectMember projectMember = new ProjectMember();
        projectMember.setProjectId(projectId);
        projectMember.setUserId(assigneeId);
        projectMemberMapper.insert(projectMember);
    }

    /**
     * 确保负责人已同步为任务成员。
     *
     * @param task 任务实体
     */
    public void ensureAssigneeMember(ProjectTask task) {
        if (task.getAssigneeId() == null || task.getAssigneeId().equals(0L)) {
            return;
        }
        ProjectTaskMember existedMember = projectTaskMemberMapper.selectOne(new LambdaQueryWrapper<ProjectTaskMember>()
                .eq(ProjectTaskMember::getTaskId, task.getId())
                .eq(ProjectTaskMember::getUserId, task.getAssigneeId())
                .last("limit 1"));
        if (existedMember != null) {
            return;
        }
        ProjectTaskMember taskMember = new ProjectTaskMember();
        taskMember.setTaskId(task.getId());
        taskMember.setUserId(task.getAssigneeId());
        projectTaskMemberMapper.insert(taskMember);
    }

    /**
     * 校验创建任务时的父任务设置是否合法。
     *
     * @param projectId    项目 ID
     * @param parentTaskId 父任务 ID
     */
    public void validateParentTaskForCreate(Long projectId, Long parentTaskId) {
        if (parentTaskId == null) {
            return;
        }
        ProjectTask parentTask = requireTaskInProject(projectId, parentTaskId);
        if (parentTask.getParentTaskId() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "暂不支持多级子任务");
        }
    }

    /**
     * 校验编辑任务时的父任务设置是否合法。
     *
     * @param task         当前任务
     * @param parentTaskId 目标父任务 ID
     */
    public void validateParentTaskForEdit(ProjectTask task, Long parentTaskId) {
        if (parentTaskId == null) {
            return;
        }
        if (parentTaskId.equals(task.getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "父任务不能是当前任务自身");
        }
        ProjectTask parentTask = requireTaskInProject(task.getProjectId(), parentTaskId);
        if (parentTask.getParentTaskId() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "暂不支持多级子任务");
        }
        if (hasChildTasks(task.getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在子任务的任务不能再设置父任务");
        }
    }

    /**
     * 校验前置任务阻塞时的目标状态是否合法。
     *
     * @param status              目标状态
     * @param projectId           项目 ID
     * @param predecessorTaskIds 前置任务 ID 列表
     */
    public void validateBlockedStatusForDependencies(String status, Long projectId, List<Long> predecessorTaskIds) {
        if (predecessorTaskIds == null || predecessorTaskIds.isEmpty()) {
            return;
        }

        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        List<ProjectTask> predecessorTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getId, predecessorTaskIds)
                .eq(ProjectTask::getProjectId, projectId)
                .eq(ProjectTask::getDeleted, 0));
        if (predecessorTasks.size() != predecessorTaskIds.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "前置任务不存在或不属于当前项目");
        }

        boolean hasUnfinishedPredecessor = false;
        for (ProjectTask predecessorTask : predecessorTasks) {
            if (completedStatusCode.equals(predecessorTask.getStatus())) {
                continue;
            }
            hasUnfinishedPredecessor = true;
            break;
        }
        if (!hasUnfinishedPredecessor) {
            return;
        }

        String firstPendingStatusCode = taskStatusConfigService.getFirstNonCompletedStatusCode();
        if (!firstPendingStatusCode.equals(status)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "前置任务未完成时，只能保存为起始待处理状态");
        }
    }

    /**
     * 校验完成状态与子任务约束。
     *
     * @param taskId 任务 ID
     * @param status 目标状态
     */
    public void validateCompleteStatusWithChildren(Long taskId, String status) {
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        if (!completedStatusCode.equals(status)) {
            return;
        }
        if (hasUnfinishedChildTasks(taskId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在未完成子任务，不能手动完成父任务");
        }
    }

    /**
     * 判断任务是否存在子任务。
     *
     * @param taskId 任务 ID
     * @return 是否存在子任务
     */
    public boolean hasChildTasks(Long taskId) {
        Long count = projectTaskMapper.selectCount(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getParentTaskId, taskId)
                .eq(ProjectTask::getDeleted, 0));
        if (count == null) {
            return false;
        }
        return count > 0;
    }

    /**
     * 规范化关联 ID 列表。
     *
     * @param ids 原始 ID 列表
     * @return 规范化后的 ID 列表
     */
    public List<Long> normalizeIdList(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> normalizedIds = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null || id <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "关联 ID 不合法");
            }
            normalizedIds.add(id);
        }
        return new ArrayList<>(normalizedIds);
    }

    /**
     * 规范化描述内容。
     *
     * @param description 任务描述
     * @return 规范化后的描述
     */
    public String normalizeDescription(String description) {
        if (description == null) {
            return "";
        }
        return description.trim();
    }

    private ProjectTask requireTaskInProject(Long projectId, Long taskId) {
        ProjectTask task = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getId, taskId)
                .eq(ProjectTask::getProjectId, projectId)
                .eq(ProjectTask::getDeleted, 0)
                .last("limit 1"));
        if (task == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "父任务不存在或不属于当前项目");
        }
        return task;
    }

    private boolean hasUnfinishedChildTasks(Long taskId) {
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getParentTaskId, taskId)
                .eq(ProjectTask::getDeleted, 0));
        if (childTasks.isEmpty()) {
            return false;
        }
        for (ProjectTask childTask : childTasks) {
            if (completedStatusCode.equals(childTask.getStatus())) {
                continue;
            }
            return true;
        }
        return false;
    }

    private String normalizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }
}
