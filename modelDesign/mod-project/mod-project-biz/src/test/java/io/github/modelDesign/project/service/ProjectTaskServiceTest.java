package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProjectTaskServiceTest {
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
                mock(ProjectTaskChangeLogService.class)
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
                mock(ProjectTaskChangeLogService.class)
        );

        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(200L).build();
        when(projectTaskReadService.getDetailByVisibleNumber(eq("TASK-200")))
                .thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByCode("TASK-200");

        assertSame(expected, result);
        verify(projectTaskReadService).getDetailByVisibleNumber(eq("TASK-200"));
    }
}
