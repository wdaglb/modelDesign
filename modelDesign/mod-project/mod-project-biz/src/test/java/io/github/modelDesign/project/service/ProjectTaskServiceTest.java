package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 项目任务服务编排测试。
 */
class ProjectTaskServiceTest {
    /**
     * 批量子任务查询应先解析父任务并委托读模型。
     */
    @Test
    void getChildrenBatchShouldResolveParentsAndReturnChildren() {
        ProjectTaskReadService projectTaskReadService = mock(ProjectTaskReadService.class);
        ProjectTaskService service = spy(new ProjectTaskService(
                mock(AuthCurrentUserApi.class),
                mock(ProjectService.class),
                projectTaskReadService,
                mock(ProjectTaskGuardService.class),
                mock(ProjectTaskLifecycleService.class),
                mock(ProjectTaskDependencyService.class),
                mock(ProjectTaskTagBindingService.class),
                mock(ProjectTaskViewAssembler.class),
                mock(ProjectTaskChangeLogService.class),
                mock(ProjectTaskTimeMetricsSupport.class),
                mock(ProjectTaskEditMoveSupport.class)
        ));

        ProjectTask parentTaskFirst = new ProjectTask();
        parentTaskFirst.setId(1L);
        ProjectTask parentTaskSecond = new ProjectTask();
        parentTaskSecond.setId(2L);
        doReturn(parentTaskFirst).when(service).requireTask(1L);
        doReturn(parentTaskSecond).when(service).requireTask(2L);

        ProjectTaskDetailVo childTask = ProjectTaskDetailVo.builder().id(10L).build();
        List<ProjectTaskDetailVo> expected = List.of(childTask);
        when(projectTaskReadService.getChildrenBatch(List.of(parentTaskFirst, parentTaskSecond)))
                .thenReturn(expected);

        List<ProjectTaskDetailVo> result = service.getChildrenBatch(List.of(1L, 2L));

        assertSame(expected, result);
        ArgumentCaptor<List<ProjectTask>> captor = ArgumentCaptor.forClass(List.class);
        verify(projectTaskReadService).getChildrenBatch(captor.capture());
        List<ProjectTask> capturedParents = captor.getValue();
        assertEquals(2, capturedParents.size());
        assertEquals(1L, capturedParents.get(0).getId());
        assertEquals(2L, capturedParents.get(1).getId());
    }

    /**
     * 编号详情查询应直接委托读模型。
     */
    @Test
    void getDetailByCodeShouldDelegateToReadService() {
        ProjectTaskReadService projectTaskReadService = mock(ProjectTaskReadService.class);
        ProjectTaskService service = new ProjectTaskService(
                mock(AuthCurrentUserApi.class),
                mock(ProjectService.class),
                projectTaskReadService,
                mock(ProjectTaskGuardService.class),
                mock(ProjectTaskLifecycleService.class),
                mock(ProjectTaskDependencyService.class),
                mock(ProjectTaskTagBindingService.class),
                mock(ProjectTaskViewAssembler.class),
                mock(ProjectTaskChangeLogService.class),
                mock(ProjectTaskTimeMetricsSupport.class),
                mock(ProjectTaskEditMoveSupport.class)
        );

        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(200L).build();
        when(projectTaskReadService.getDetailByVisibleNumber(eq("TASK-200")))
                .thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByCode("TASK-200");

        assertSame(expected, result);
        verify(projectTaskReadService).getDetailByVisibleNumber(eq("TASK-200"));
    }

    /**
     * 编辑任务修改所属项目时应写入目标项目，并清空原项目内的父任务和前置任务。
     */
    @Test
    void editShouldMoveTaskToTargetProjectAndDetachOldRelations() {
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskGuardService projectTaskGuardService = mock(ProjectTaskGuardService.class);
        ProjectTaskDependencyService projectTaskDependencyService =
                mock(ProjectTaskDependencyService.class);
        ProjectTaskTagBindingService projectTaskTagBindingService =
                mock(ProjectTaskTagBindingService.class);
        ProjectTaskViewAssembler projectTaskViewAssembler =
                mock(ProjectTaskViewAssembler.class);
        ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport =
                mock(ProjectTaskTimeMetricsSupport.class);

        ProjectTaskService service = spy(new ProjectTaskService(
                mock(AuthCurrentUserApi.class),
                projectService,
                mock(ProjectTaskReadService.class),
                projectTaskGuardService,
                mock(ProjectTaskLifecycleService.class),
                projectTaskDependencyService,
                projectTaskTagBindingService,
                projectTaskViewAssembler,
                mock(ProjectTaskChangeLogService.class),
                projectTaskTimeMetricsSupport,
                new ProjectTaskEditMoveSupport(
                        projectTaskGuardService,
                        projectTaskDependencyService
                )
        ));

        ProjectTask existedTask = new ProjectTask();
        existedTask.setId(5001L);
        existedTask.setProjectId(101L);
        existedTask.setParentTaskId(4001L);
        existedTask.setTitle("原任务");
        existedTask.setDescription("原描述");
        existedTask.setStatus("todo");
        existedTask.setPriority("medium");
        existedTask.setAssigneeId(7001L);
        existedTask.setDeleted(0);

        Project targetProject = new Project();
        targetProject.setId(202L);
        targetProject.setTenantId(1001L);

        doReturn(existedTask).when(service).requireTask(5001L);
        doReturn(true).when(service).updateById(any(ProjectTask.class));
        when(projectService.requireProject(202L)).thenReturn(targetProject);
        when(projectTaskGuardService.validateTypeId(9001L)).thenReturn(9001L);
        when(projectTaskGuardService.validateStatus("todo")).thenReturn("todo");
        when(projectTaskGuardService.normalizeDescription(any()))
                .thenReturn("迁移后描述");
        when(projectTaskDependencyService.findPredecessorIdsByTaskId(5001L))
                .thenReturn(List.of(3001L), Collections.emptyList());
        when(projectTaskTagBindingService.findTagIdsByTaskId(5001L))
                .thenReturn(Collections.emptyList());
        when(projectTaskViewAssembler.toTaskVo(any()))
                .thenReturn(ProjectTaskDetailVo.builder().id(5001L).build());

        ProjectTaskEditRequest request = new ProjectTaskEditRequest();
        request.setProjectId(202L);
        request.setTitle("迁移后任务");
        request.setDescription("迁移后描述");
        request.setTypeId(9001L);
        request.setStatus("todo");
        request.setPriority("medium");
        request.setAssigneeId(7001L);

        service.edit(5001L, request);

        ArgumentCaptor<ProjectTask> taskCaptor =
                ArgumentCaptor.forClass(ProjectTask.class);
        verify(service).updateById(taskCaptor.capture());
        ProjectTask updatedTask = taskCaptor.getValue();
        assertEquals(202L, updatedTask.getProjectId());
        assertNull(updatedTask.getParentTaskId());
        verify(projectTaskGuardService).ensureProjectMember(202L, 7001L);
        verify(projectTaskDependencyService)
                .saveDependencies(5001L, 202L, Collections.emptyList());
        verify(projectTaskTagBindingService)
                .saveBindings(5001L, 1001L, Collections.emptyList());
    }
}
