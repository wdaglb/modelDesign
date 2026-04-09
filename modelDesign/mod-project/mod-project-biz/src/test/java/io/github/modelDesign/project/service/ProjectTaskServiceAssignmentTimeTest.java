package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 任务负责人指派时间写入测试。
 */
class ProjectTaskServiceAssignmentTimeTest {
    /**
     * 创建任务时有负责人应写入负责人指派时间。
     */
    @Test
    void createShouldWriteAssigneeAssignedAtWhenAssigneePresent() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService projectTaskReadService = mock(ProjectTaskReadService.class);
        ProjectTaskGuardService projectTaskGuardService = mock(ProjectTaskGuardService.class);
        ProjectTaskLifecycleService projectTaskLifecycleService = mock(ProjectTaskLifecycleService.class);
        ProjectTaskDependencyService projectTaskDependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskTagBindingService projectTaskTagBindingService = mock(ProjectTaskTagBindingService.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectTaskChangeLogService projectTaskChangeLogService = mock(ProjectTaskChangeLogService.class);
        ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport = mock(ProjectTaskTimeMetricsSupport.class);

        ProjectTaskService service = spy(new ProjectTaskService(
                authCurrentUserApi,
                projectService,
                projectTaskReadService,
                projectTaskGuardService,
                projectTaskLifecycleService,
                projectTaskDependencyService,
                projectTaskTagBindingService,
                projectTaskViewAssembler,
                projectTaskChangeLogService,
                projectTaskTimeMetricsSupport
        ));

        Project project = new Project();
        project.setId(101L);
        project.setTenantId(1001L);
        when(projectService.requireProject(101L)).thenReturn(project);
        when(projectTaskGuardService.validateStatus("todo")).thenReturn("todo");
        when(projectTaskGuardService.normalizeIdList(any())).thenReturn(Collections.emptyList());
        when(projectTaskGuardService.normalizeDescription(any())).thenReturn("创建任务描述");
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(2001L).tenantId(1001L).build());
        when(projectTaskViewAssembler.toTaskVo(any()))
                .thenReturn(ProjectTaskDetailVo.builder().id(3001L).build());

        LocalDateTime assignedAt = LocalDateTime.of(2026, 4, 8, 11, 0, 0);
        when(projectTaskTimeMetricsSupport.resolveAssigneeAssignedAtOnCreate(
                eq(7001L), any(LocalDateTime.class)))
                .thenReturn(assignedAt);

        doAnswer(invocation -> {
            ProjectTask task = invocation.getArgument(0);
            task.setId(3001L);
            return true;
        }).when(service).save(any(ProjectTask.class));

        ProjectTaskCreateRequest request = new ProjectTaskCreateRequest();
        request.setProjectId(101L);
        request.setTitle("新增任务");
        request.setDescription("创建任务描述");
        request.setStatus("todo");
        request.setPriority("medium");
        request.setAssigneeId(7001L);

        service.create(request);

        ArgumentCaptor<ProjectTask> taskCaptor = ArgumentCaptor.forClass(ProjectTask.class);
        verify(service).save(taskCaptor.capture());
        ProjectTask savedTask = taskCaptor.getValue();
        assertEquals(7001L, savedTask.getAssigneeId());
        assertEquals(assignedAt, savedTask.getAssigneeAssignedAt());
        verify(projectTaskTimeMetricsSupport)
                .resolveAssigneeAssignedAtOnCreate(eq(7001L), any(LocalDateTime.class));
    }

    /**
     * 编辑任务时负责人变化应重置负责人指派时间。
     */
    @Test
    void editShouldResetAssigneeAssignedAtWhenAssigneeChanges() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService projectTaskReadService = mock(ProjectTaskReadService.class);
        ProjectTaskGuardService projectTaskGuardService = mock(ProjectTaskGuardService.class);
        ProjectTaskLifecycleService projectTaskLifecycleService = mock(ProjectTaskLifecycleService.class);
        ProjectTaskDependencyService projectTaskDependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskTagBindingService projectTaskTagBindingService = mock(ProjectTaskTagBindingService.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectTaskChangeLogService projectTaskChangeLogService = mock(ProjectTaskChangeLogService.class);
        ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport = mock(ProjectTaskTimeMetricsSupport.class);

        ProjectTaskService service = spy(new ProjectTaskService(
                authCurrentUserApi,
                projectService,
                projectTaskReadService,
                projectTaskGuardService,
                projectTaskLifecycleService,
                projectTaskDependencyService,
                projectTaskTagBindingService,
                projectTaskViewAssembler,
                projectTaskChangeLogService,
                projectTaskTimeMetricsSupport
        ));

        ProjectTask existedTask = new ProjectTask();
        existedTask.setId(5001L);
        existedTask.setProjectId(101L);
        existedTask.setParentTaskId(0L);
        existedTask.setTitle("原任务");
        existedTask.setDescription("原描述");
        existedTask.setStatus("todo");
        existedTask.setPriority("medium");
        existedTask.setCreatorId(2001L);
        existedTask.setAssigneeId(7001L);
        existedTask.setDeleted(0);
        LocalDateTime previousAssignedAt = LocalDateTime.of(2026, 4, 5, 10, 0, 0);
        existedTask.setAssigneeAssignedAt(previousAssignedAt);

        doReturn(existedTask).when(service).requireTask(5001L);
        doReturn(true).when(service).updateById(any(ProjectTask.class));

        Project project = new Project();
        project.setId(101L);
        project.setTenantId(1001L);
        when(projectService.requireProject(101L)).thenReturn(project);
        when(projectTaskGuardService.validateStatus("inProgress")).thenReturn("inProgress");
        when(projectTaskGuardService.normalizeDescription(any())).thenReturn("编辑后描述");
        when(projectTaskDependencyService.findPredecessorIdsByTaskId(5001L))
                .thenReturn(Collections.emptyList());
        when(projectTaskTagBindingService.findTagIdsByTaskId(5001L))
                .thenReturn(Collections.emptyList());
        when(projectTaskViewAssembler.toTaskVo(any()))
                .thenReturn(ProjectTaskDetailVo.builder().id(5001L).build());

        LocalDateTime reassignedAt = LocalDateTime.of(2026, 4, 8, 11, 30, 0);
        when(projectTaskTimeMetricsSupport.resolveAssigneeAssignedAtOnEdit(
                eq(7001L), eq(7002L), eq(previousAssignedAt), any(LocalDateTime.class)))
                .thenReturn(reassignedAt);

        ProjectTaskEditRequest request = new ProjectTaskEditRequest();
        request.setTitle("编辑后任务");
        request.setDescription("编辑后描述");
        request.setStatus("inProgress");
        request.setPriority("high");
        request.setAssigneeId(7002L);

        service.edit(5001L, request);

        ArgumentCaptor<ProjectTask> taskCaptor = ArgumentCaptor.forClass(ProjectTask.class);
        verify(service).updateById(taskCaptor.capture());
        ProjectTask updatedTask = taskCaptor.getValue();
        assertEquals(7002L, updatedTask.getAssigneeId());
        assertEquals(reassignedAt, updatedTask.getAssigneeAssignedAt());
        verify(projectTaskTimeMetricsSupport).resolveAssigneeAssignedAtOnEdit(
                eq(7001L),
                eq(7002L),
                eq(previousAssignedAt),
                any(LocalDateTime.class)
        );
    }
}
