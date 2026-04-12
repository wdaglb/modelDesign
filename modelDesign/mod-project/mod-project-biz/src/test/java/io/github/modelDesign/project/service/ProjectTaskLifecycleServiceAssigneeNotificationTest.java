package io.github.modelDesign.project.service;

import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.system.api.SystemMessageApi;
import io.github.modelDesign.system.api.dto.SystemMessagePublishCommand;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 任务负责人指派通知测试。
 */
class ProjectTaskLifecycleServiceAssigneeNotificationTest {
    /**
     * 创建任务时首次指派负责人应发送系统消息。
     */
    @Test
    void createShouldPublishAssigneeMessage() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskStatusConfigService taskStatusConfigService = mock(TaskStatusConfigService.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDependencyService projectTaskDependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskChangeLogService projectTaskChangeLogService = mock(ProjectTaskChangeLogService.class);
        SystemMessageApi systemMessageApi = mock(SystemMessageApi.class);

        ProjectTaskLifecycleService service = new ProjectTaskLifecycleService(
                projectTaskMapper,
                taskStatusConfigService,
                projectService,
                projectTaskDependencyService,
                projectTaskChangeLogService,
                systemMessageApi
        );

        Project project = new Project();
        project.setId(101L);
        project.setTenantId(1001L);
        when(projectService.requireProject(101L)).thenReturn(project);

        ProjectTask task = new ProjectTask();
        task.setId(3001L);
        task.setProjectId(101L);
        task.setTitle("完善通知投递");
        task.setAssigneeId(7001L);

        service.handleTaskAssigneeChanged(null, task);

        ArgumentCaptor<SystemMessagePublishCommand> commandCaptor =
                ArgumentCaptor.forClass(SystemMessagePublishCommand.class);
        verify(systemMessageApi).publish(commandCaptor.capture());
        SystemMessagePublishCommand command = commandCaptor.getValue();
        assertEquals("你被指派了新任务", command.getTitle());
        assertEquals("任务【完善通知投递】已指派给你，请及时处理。", command.getContent());
        assertEquals("/agile-board/?taskId=3001", command.getRedirectUrl());
        assertEquals(1001L, command.getTenantId());
        assertEquals(1, command.getReceiverUserIds().size());
        assertEquals(7001L, command.getReceiverUserIds().get(0));
    }

    /**
     * 编辑任务时负责人未变化不应重复发送系统消息。
     */
    @Test
    void editShouldSkipMessageWhenAssigneeNotChanged() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskStatusConfigService taskStatusConfigService = mock(TaskStatusConfigService.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDependencyService projectTaskDependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskChangeLogService projectTaskChangeLogService = mock(ProjectTaskChangeLogService.class);
        SystemMessageApi systemMessageApi = mock(SystemMessageApi.class);

        ProjectTaskLifecycleService service = new ProjectTaskLifecycleService(
                projectTaskMapper,
                taskStatusConfigService,
                projectService,
                projectTaskDependencyService,
                projectTaskChangeLogService,
                systemMessageApi
        );

        ProjectTask beforeTask = new ProjectTask();
        beforeTask.setAssigneeId(7001L);
        ProjectTask afterTask = new ProjectTask();
        afterTask.setAssigneeId(7001L);

        service.handleTaskAssigneeChanged(beforeTask, afterTask);

        verify(systemMessageApi, never()).publish(org.mockito.ArgumentMatchers.any());
    }

    /**
     * 负责人被清空时不应发送系统消息。
     */
    @Test
    void editShouldSkipMessageWhenAssigneeRemoved() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskStatusConfigService taskStatusConfigService = mock(TaskStatusConfigService.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDependencyService projectTaskDependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskChangeLogService projectTaskChangeLogService = mock(ProjectTaskChangeLogService.class);
        SystemMessageApi systemMessageApi = mock(SystemMessageApi.class);

        ProjectTaskLifecycleService service = new ProjectTaskLifecycleService(
                projectTaskMapper,
                taskStatusConfigService,
                projectService,
                projectTaskDependencyService,
                projectTaskChangeLogService,
                systemMessageApi
        );

        ProjectTask beforeTask = new ProjectTask();
        beforeTask.setAssigneeId(7001L);
        ProjectTask afterTask = new ProjectTask();
        afterTask.setAssigneeId(0L);

        service.handleTaskAssigneeChanged(beforeTask, afterTask);

        verify(systemMessageApi, never()).publish(org.mockito.ArgumentMatchers.any());
    }
}
