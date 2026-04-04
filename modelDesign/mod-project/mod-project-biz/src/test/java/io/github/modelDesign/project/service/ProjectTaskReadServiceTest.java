package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * 项目任务读模型测试。
 */
class ProjectTaskReadServiceTest {
    /**
     * TASK- 前缀编号应解析为任务 ID。
     */
    @Test
    void getDetailByVisibleNumberShouldSupportTaskPrefix() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask task = new ProjectTask();
        task.setId(2048L);
        task.setProjectId(100L);
        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(2048L).build();
        when(projectTaskMapper.selectOne(any())).thenReturn(task);
        when(projectTaskViewAssembler.toTaskVo(task)).thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByVisibleNumber("TASK-2048");

        assertSame(expected, result);
        verify(projectService).requireProject(100L);
    }

    /**
     * 纯数字编号应解析为任务 ID。
     */
    @Test
    void getDetailByVisibleNumberShouldSupportNumericCode() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask task = new ProjectTask();
        task.setId(2048L);
        task.setProjectId(101L);
        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(2048L).build();
        when(projectTaskMapper.selectOne(any())).thenReturn(task);
        when(projectTaskViewAssembler.toTaskVo(task)).thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByVisibleNumber("2048");

        assertSame(expected, result);
        verify(projectService).requireProject(101L);
    }

    /**
     * 非法格式编号应抛 400 异常。
     */
    @Test
    void getDetailByVisibleNumberShouldRejectInvalidCode() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getDetailByVisibleNumber("TASK-20A8"));

        assertEquals(400, exception.getStatus());
        assertEquals("任务编号不合法", exception.getMessage());
        verifyNoInteractions(projectTaskMapper);
    }

    /**
     * 查询不到任务应抛 404 异常。
     */
    @Test
    void getDetailByVisibleNumberShouldThrowWhenTaskMissing() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        when(projectTaskMapper.selectOne(any())).thenReturn(null);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getDetailByVisibleNumber("2048"));

        assertEquals(404, exception.getStatus());
        assertEquals("任务不存在", exception.getMessage());
        verifyNoInteractions(projectService);
    }

    /**
     * 批量子任务查询应返回读模型视图列表。
     */
    @Test
    void getChildrenBatchShouldReturnChildren() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask parentTaskFirst = new ProjectTask();
        parentTaskFirst.setId(1L);
        ProjectTask parentTaskSecond = new ProjectTask();
        parentTaskSecond.setId(2L);

        ProjectTask childTask = new ProjectTask();
        childTask.setId(10L);
        childTask.setParentTaskId(1L);
        List<ProjectTask> children = List.of(childTask);
        List<ProjectTaskDetailVo> expected = List.of(ProjectTaskDetailVo.builder().id(10L).build());

        when(projectTaskMapper.selectList(any())).thenReturn(children);
        when(projectTaskViewAssembler.toTaskVoList(children)).thenReturn(expected);

        List<ProjectTaskDetailVo> result = service.getChildrenBatch(List.of(parentTaskFirst, parentTaskSecond));

        assertSame(expected, result);
        verify(projectTaskMapper).selectList(any());
        verify(projectTaskViewAssembler).toTaskVoList(children);
    }

    private ProjectTaskReadService buildService(ProjectTaskMapper projectTaskMapper,
                                                ProjectTaskViewAssembler projectTaskViewAssembler,
                                                ProjectService projectService) {
        return new ProjectTaskReadService(
                mock(AuthCurrentUserApi.class),
                mock(AuthUserApi.class),
                projectService,
                mock(ProjectMapper.class),
                projectTaskMapper,
                mock(ProjectTaskGuardService.class),
                projectTaskViewAssembler
        );
    }
}
