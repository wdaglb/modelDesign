package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.system.api.SystemMessageApi;
import io.github.modelDesign.system.api.dto.SystemMessagePublishCommand;
import io.github.modelDesign.system.api.dto.SystemMessageScopeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 任务生命周期服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskLifecycleService {
    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 任务依赖关系服务。
     */
    private final ProjectTaskDependencyService projectTaskDependencyService;

    /**
     * 任务变更日志服务。
     */
    private final ProjectTaskChangeLogService projectTaskChangeLogService;

    /**
     * 系统消息发布接口。
     */
    private final SystemMessageApi systemMessageApi;

    /**
     * 处理任务完成后的生命周期逻辑。
     *
     * @param task         当前任务
     * @param beforeStatus 变更前状态
     */
    @Transactional(rollbackFor = Exception.class)
    public void handleTaskCompleted(ProjectTask task, String beforeStatus) {
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        if (completedStatusCode.equals(beforeStatus)) {
            return;
        }
        if (!completedStatusCode.equals(task.getStatus())) {
            return;
        }
        Set<Long> notifiedTaskIds = new LinkedHashSet<>();
        autoCompleteParentIfNeeded(task.getParentTaskId(), notifiedTaskIds);
        notifyDependencyReady(task, notifiedTaskIds);
    }

    private void autoCompleteParentIfNeeded(Long parentTaskId, Set<Long> notifiedTaskIds) {
        if (parentTaskId == null) {
            return;
        }
        ProjectTask parentTask = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getId, parentTaskId)
                .eq(ProjectTask::getDeleted, 0)
                .last("limit 1"));
        if (parentTask == null) {
            return;
        }

        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        if (completedStatusCode.equals(parentTask.getStatus())) {
            return;
        }

        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getParentTaskId, parentTaskId)
                .eq(ProjectTask::getDeleted, 0));
        if (childTasks.isEmpty()) {
            return;
        }
        for (ProjectTask childTask : childTasks) {
            if (completedStatusCode.equals(childTask.getStatus())) {
                continue;
            }
            return;
        }

        ProjectTask beforeParentTask = copyTask(parentTask);
        parentTask.setStatus(completedStatusCode);
        projectTaskMapper.updateById(parentTask);
        projectTaskChangeLogService.logAutoComplete(beforeParentTask, parentTask);
        notifyDependencyReady(parentTask, notifiedTaskIds);
        autoCompleteParentIfNeeded(parentTask.getParentTaskId(), notifiedTaskIds);
    }

    private void notifyDependencyReady(ProjectTask completedTask, Set<Long> notifiedTaskIds) {
        List<Long> dependentTaskIds = projectTaskDependencyService.findDependentTaskIds(completedTask.getId());
        if (dependentTaskIds.isEmpty()) {
            return;
        }
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        for (Long dependentTaskId : dependentTaskIds) {
            if (notifiedTaskIds.contains(dependentTaskId)) {
                continue;
            }
            ProjectTask dependentTask = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
                    .eq(ProjectTask::getId, dependentTaskId)
                    .eq(ProjectTask::getDeleted, 0)
                    .last("limit 1"));
            if (dependentTask == null) {
                continue;
            }
            if (completedStatusCode.equals(dependentTask.getStatus())) {
                continue;
            }
            if (!projectTaskDependencyService.canStart(dependentTask.getId())) {
                continue;
            }
            publishDependencyReadyMessage(dependentTask);
            projectTaskChangeLogService.logDependencyReady(dependentTask.getId(), List.of(completedTask.getId()));
            notifiedTaskIds.add(dependentTaskId);
        }
    }

    private void publishDependencyReadyMessage(ProjectTask task) {
        if (task.getAssigneeId() == null || task.getAssigneeId().equals(0L)) {
            return;
        }
        Project project = projectService.requireProject(task.getProjectId());
        SystemMessagePublishCommand command = SystemMessagePublishCommand.builder()
                .scopeType(SystemMessageScopeType.USER)
                .tenantId(project.getTenantId())
                .receiverUserIds(List.of(task.getAssigneeId()))
                .category("projectTask")
                .title("任务已满足开始条件")
                .content("任务【" + task.getTitle() + "】的前置任务已全部完成，可以开始处理。")
                .redirectUrl("/project/task/detail?id=" + task.getId())
                .build();
        systemMessageApi.publish(command);
    }

    private ProjectTask copyTask(ProjectTask source) {
        ProjectTask target = new ProjectTask();
        target.setId(source.getId());
        target.setProjectId(source.getProjectId());
        target.setParentTaskId(source.getParentTaskId());
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setStatus(source.getStatus());
        target.setPriority(source.getPriority());
        target.setCreatorId(source.getCreatorId());
        target.setAssigneeId(source.getAssigneeId());
        target.setWorkDays(source.getWorkDays());
        target.setStartTime(source.getStartTime());
        target.setDueTime(source.getDueTime());
        target.setDeleted(source.getDeleted());
        target.setCreateTime(source.getCreateTime());
        target.setUpdateTime(source.getUpdateTime());
        return target;
    }
}
