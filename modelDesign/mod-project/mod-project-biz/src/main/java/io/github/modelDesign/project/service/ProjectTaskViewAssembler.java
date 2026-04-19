package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.TaskType;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskTypeMapper;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import io.github.modelDesign.project.response.ProjectTaskPredecessorVo;
import io.github.modelDesign.project.response.ProjectTaskTagVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 任务详情组装服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskViewAssembler {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 任务依赖关系服务。
     */
    private final ProjectTaskDependencyService projectTaskDependencyService;

    /**
     * 任务标签绑定服务。
     */
    private final ProjectTaskTagBindingService projectTaskTagBindingService;

    /**
     * 任务动态服务。
     */
    private final ProjectTaskDynamicService projectTaskDynamicService;

    /**
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 任务类型 Mapper。
     */
    private final TaskTypeMapper taskTypeMapper;

    /**
     * 任务时间指标支持类。
     */
    private final ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport;

    /**
     * 批量组装任务详情。
     *
     * @param tasks 任务实体列表
     * @return 任务详情列表
     */
    public List<ProjectTaskDetailVo> toTaskVoList(List<ProjectTask> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> taskIds = new LinkedHashSet<>();
        Set<Long> parentTaskIds = new LinkedHashSet<>();
        Set<Long> projectIds = new LinkedHashSet<>();
        Set<Long> typeIds = new LinkedHashSet<>();
        Set<Long> userIds = new LinkedHashSet<>();
        for (ProjectTask task : tasks) {
            taskIds.add(task.getId());
            if (task.getParentTaskId() != null) {
                parentTaskIds.add(task.getParentTaskId());
            }
            if (task.getProjectId() != null) {
                projectIds.add(task.getProjectId());
            }
            if (task.getTypeId() != null) {
                typeIds.add(task.getTypeId());
            }
            if (task.getCreatorId() != null) {
                userIds.add(task.getCreatorId());
            }
            if (task.getAssigneeId() != null) {
                userIds.add(task.getAssigneeId());
            }
        }

        Map<Long, AuthUserSimpleDto> userMap = getUserMap(userIds);
        Map<Long, Project> projectMap = getProjectMap(projectIds);
        Map<Long, String> projectNameMap = getProjectNameMap(projectMap);
        Map<Long, String> projectCodeMap = getProjectCodeMap(projectMap);
        Map<Long, String> parentTaskTitleMap = getParentTaskTitleMap(parentTaskIds);
        Map<Long, String> typeNameMap = getTypeNameMap(typeIds);
        Map<Long, Integer> childTaskCountMap = getChildTaskCountMap(taskIds);
        Map<Long, Integer> completedChildTaskCountMap = getCompletedChildTaskCountMap(taskIds);
        Map<Long, List<Long>> predecessorIdMap = projectTaskDependencyService.findPredecessorIdMapByTaskIds(taskIds);
        Map<Long, List<ProjectTaskPredecessorVo>> predecessorMap = projectTaskDependencyService.findPredecessorMapByTaskIds(taskIds);
        Map<Long, List<ProjectTaskPredecessorVo>> unfinishedPredecessorMap = projectTaskDependencyService.findUnfinishedPredecessorMapByTaskIds(taskIds);
        Map<Long, List<Long>> tagIdMap = projectTaskTagBindingService.findTagIdMapByTaskIds(taskIds);
        Map<Long, List<ProjectTaskTagVo>> tagMap = projectTaskTagBindingService.findTagMapByTaskIds(taskIds);
        Map<Long, String> latestDynamicSummaryMap =
                projectTaskDynamicService.findLatestSummaryMapByTaskIds(taskIds);

        LocalDateTime now = LocalDateTime.now();
        List<ProjectTaskDetailVo> result = new ArrayList<>();
        for (ProjectTask task : tasks) {
            List<ProjectTaskPredecessorVo> unfinishedPredecessors = unfinishedPredecessorMap.get(task.getId());
            boolean canStart = true;
            if (unfinishedPredecessors != null && !unfinishedPredecessors.isEmpty()) {
                canStart = false;
            }
            String blockedReason = buildBlockedReason(unfinishedPredecessors);
            List<Long> predecessorTaskIds = predecessorIdMap.get(task.getId());
            if (predecessorTaskIds == null) {
                predecessorTaskIds = Collections.emptyList();
            }
            List<ProjectTaskPredecessorVo> predecessorTasks = predecessorMap.get(task.getId());
            if (predecessorTasks == null) {
                predecessorTasks = Collections.emptyList();
            }
            List<Long> tagIds = tagIdMap.get(task.getId());
            if (tagIds == null) {
                tagIds = Collections.emptyList();
            }
            List<ProjectTaskTagVo> tags = tagMap.get(task.getId());
            if (tags == null) {
                tags = Collections.emptyList();
            }

            result.add(ProjectTaskDetailVo.builder()
                    .id(task.getId())
                    .projectId(task.getProjectId())
                    .projectCode(projectCodeMap.getOrDefault(task.getProjectId(), ""))
                    .parentTaskId(task.getParentTaskId())
                    .parentTaskTitle(parentTaskTitleMap.getOrDefault(task.getParentTaskId(), ""))
                    .childTaskCount(childTaskCountMap.getOrDefault(task.getId(), 0))
                    .completedChildTaskCount(completedChildTaskCountMap.getOrDefault(task.getId(), 0))
                    .title(task.getTitle())
                    .description(task.getDescription())
                    .latestDynamicSummary(
                            latestDynamicSummaryMap.getOrDefault(task.getId(), "")
                    )
                    .typeId(task.getTypeId())
                    .typeName(typeNameMap.getOrDefault(task.getTypeId(), ""))
                    .status(task.getStatus())
                    .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                    .priority(task.getPriority())
                    .predecessorTaskIds(predecessorTaskIds)
                    .predecessorTasks(predecessorTasks)
                    .tagIds(tagIds)
                    .tags(tags)
                    .canStart(canStart)
                    .blockedReason(blockedReason)
                    .workDays(task.getWorkDays())
                    .assigneeId(task.getAssigneeId())
                    .assignee(resolveUserNickname(userMap.get(task.getAssigneeId())))
                    .assigneeAssignedAt(formatDateTime(task.getAssigneeAssignedAt()))
                    .assigneeElapsedDays(projectTaskTimeMetricsSupport.calculateElapsedDays(
                            task.getAssigneeAssignedAt(),
                            now
                    ))
                    .creatorId(task.getCreatorId())
                    .creator(resolveUserNickname(userMap.get(task.getCreatorId())))
                    .startTime(formatDateTime(task.getStartTime()))
                    .dueTime(formatDateTime(task.getDueTime()))
                    .createdElapsedDays(projectTaskTimeMetricsSupport.calculateElapsedDays(
                            task.getCreateTime(),
                            now
                    ))
                    .createdAt(formatDateTime(task.getCreateTime()))
                    .updatedAt(formatDateTime(task.getUpdateTime()))
                    .build());
        }
        return result;
    }

    /**
     * 组装单个任务详情。
     *
     * @param task 任务实体
     * @return 任务详情
     */
    public ProjectTaskDetailVo toTaskVo(ProjectTask task) {
        List<ProjectTaskDetailVo> taskVos = toTaskVoList(List.of(task));
        if (taskVos.isEmpty()) {
            return null;
        }
        return taskVos.get(0);
    }

    private Map<Long, AuthUserSimpleDto> getUserMap(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(userIds);
    }

    private Map<Long, Project> getProjectMap(Set<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Project> projects = projectMapper.selectBatchIds(projectIds);
        if (projects.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Project> projectMap = new LinkedHashMap<>();
        for (Project project : projects) {
            projectMap.put(project.getId(), project);
        }
        return projectMap;
    }

    /**
     * 提取项目名称映射，避免任务视图组装阶段重复查询项目表。
     *
     * @param projectMap 项目映射
     * @return 项目名称映射
     */
    private Map<Long, String> getProjectNameMap(Map<Long, Project> projectMap) {
        if (projectMap.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> projectNameMap = new LinkedHashMap<>();
        for (Map.Entry<Long, Project> entry : projectMap.entrySet()) {
            projectNameMap.put(entry.getKey(), entry.getValue().getName());
        }
        return projectNameMap;
    }

    /**
     * 提取项目编号映射，供任务卡片拼接可见任务编号。
     *
     * @param projectMap 项目映射
     * @return 项目编号映射
     */
    private Map<Long, String> getProjectCodeMap(Map<Long, Project> projectMap) {
        if (projectMap.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> projectCodeMap = new LinkedHashMap<>();
        for (Map.Entry<Long, Project> entry : projectMap.entrySet()) {
            projectCodeMap.put(entry.getKey(), entry.getValue().getCode());
        }
        return projectCodeMap;
    }

    private Map<Long, String> getParentTaskTitleMap(Set<Long> parentTaskIds) {
        if (parentTaskIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProjectTask> parentTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getId, parentTaskIds)
                .eq(ProjectTask::getDeleted, 0));
        if (parentTasks.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> titleMap = new LinkedHashMap<>();
        for (ProjectTask parentTask : parentTasks) {
            titleMap.put(parentTask.getId(), parentTask.getTitle());
        }
        return titleMap;
    }

    private Map<Long, Integer> getChildTaskCountMap(Collection<Long> taskIds) {
        if (taskIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getParentTaskId, taskIds)
                .eq(ProjectTask::getDeleted, 0));
        if (childTasks.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Integer> childCountMap = new LinkedHashMap<>();
        for (ProjectTask childTask : childTasks) {
            Integer count = childCountMap.get(childTask.getParentTaskId());
            if (count == null) {
                count = 0;
            }
            childCountMap.put(childTask.getParentTaskId(), count + 1);
        }
        return childCountMap;
    }

    private Map<Long, Integer> getCompletedChildTaskCountMap(Collection<Long> taskIds) {
        if (taskIds.isEmpty()) {
            return Collections.emptyMap();
        }
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getParentTaskId, taskIds)
                .eq(ProjectTask::getDeleted, 0));
        if (childTasks.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Integer> completedChildCountMap = new LinkedHashMap<>();
        for (ProjectTask childTask : childTasks) {
            if (!completedStatusCode.equals(childTask.getStatus())) {
                continue;
            }
            Integer count = completedChildCountMap.get(childTask.getParentTaskId());
            if (count == null) {
                count = 0;
            }
            completedChildCountMap.put(childTask.getParentTaskId(), count + 1);
        }
        return completedChildCountMap;
    }

    /**
     * 提取任务类型名称映射，避免列表态重复查询类型表。
     *
     * @param typeIds 类型 ID 集合
     * @return 类型名称映射
     */
    private Map<Long, String> getTypeNameMap(Set<Long> typeIds) {
        if (typeIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<TaskType> taskTypes = taskTypeMapper.selectBatchIds(typeIds);
        if (taskTypes.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> typeNameMap = new LinkedHashMap<>();
        for (TaskType taskType : taskTypes) {
            typeNameMap.put(taskType.getId(), taskType.getName());
        }
        return typeNameMap;
    }

    private String resolveUserNickname(AuthUserSimpleDto user) {
        if (user == null) {
            return "";
        }
        if (user.getNickname() == null) {
            return "";
        }
        return user.getNickname();
    }

    private String buildBlockedReason(List<ProjectTaskPredecessorVo> unfinishedPredecessors) {
        if (unfinishedPredecessors == null || unfinishedPredecessors.isEmpty()) {
            return "";
        }
        List<String> titles = new ArrayList<>();
        for (ProjectTaskPredecessorVo predecessor : unfinishedPredecessors) {
            if (predecessor == null) {
                continue;
            }
            if (predecessor.getTitle() == null || predecessor.getTitle().isBlank()) {
                titles.add("任务#" + predecessor.getTaskId());
            } else {
                titles.add(predecessor.getTitle());
            }
        }
        if (titles.isEmpty()) {
            return "前置任务未完成";
        }
        return "前置任务未完成：" + String.join("、", titles);
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
