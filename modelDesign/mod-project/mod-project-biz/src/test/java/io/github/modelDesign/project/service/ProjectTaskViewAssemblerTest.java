package io.github.modelDesign.project.service;

import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 任务详情组装服务测试。
 */
class ProjectTaskViewAssemblerTest {
    /**
     * 任务详情应携带项目编号，供前端拼接可见任务编号。
     */
    @Test
    void toTaskVoListShouldContainProjectCode() {
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskDependencyService dependencyService = mock(ProjectTaskDependencyService.class);
        ProjectTaskTagBindingService tagBindingService = mock(ProjectTaskTagBindingService.class);
        TaskStatusConfigService taskStatusConfigService = mock(TaskStatusConfigService.class);
        ProjectTaskViewAssembler assembler = new ProjectTaskViewAssembler(
                mock(io.github.modelDesign.auth.api.AuthUserApi.class),
                projectMapper,
                projectTaskMapper,
                dependencyService,
                tagBindingService,
                taskStatusConfigService
        );

        ProjectTask task = new ProjectTask();
        task.setId(1L);
        task.setProjectId(10L);
        task.setTitle("补充项目编号");
        task.setStatus("todo");
        task.setPriority("medium");

        Project project = new Project();
        project.setId(10L);
        project.setName("任务平台");
        project.setCode("TASK");

        when(projectMapper.selectBatchIds(any())).thenReturn(List.of(project));
        when(projectTaskMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dependencyService.findPredecessorIdMapByTaskIds(any()))
                .thenReturn(Collections.emptyMap());
        when(dependencyService.findPredecessorMapByTaskIds(any()))
                .thenReturn(Collections.emptyMap());
        when(dependencyService.findUnfinishedPredecessorMapByTaskIds(any()))
                .thenReturn(Collections.emptyMap());
        when(tagBindingService.findTagIdMapByTaskIds(any()))
                .thenReturn(Collections.emptyMap());
        when(tagBindingService.findTagMapByTaskIds(any()))
                .thenReturn(Collections.emptyMap());
        when(taskStatusConfigService.getCompletedStatusCode()).thenReturn("done");

        List<ProjectTaskDetailVo> result = assembler.toTaskVoList(List.of(task));

        assertEquals(1, result.size());
        assertEquals("TASK", result.get(0).getProjectCode());
        assertEquals("任务平台", result.get(0).getProjectName());
    }
}
