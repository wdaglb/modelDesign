package io.github.modelDesign.project.api;

import io.github.modelDesign.project.api.dto.MyTodoTaskDto;
import io.github.modelDesign.project.api.dto.PageResult;
import io.github.modelDesign.project.api.dto.ProjectTaskCompleteCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskCreateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskDto;
import io.github.modelDesign.project.api.dto.ProjectTaskMyTodoRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskQueryRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskStatusUpdateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskTypeDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDynamicCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import io.github.modelDesign.project.response.ProjectTaskTypeVo;
import io.github.modelDesign.project.service.ProjectTaskDynamicService;
import io.github.modelDesign.project.service.ProjectTaskService;
import io.github.modelDesign.project.service.ProjectTaskWorkReportService;
import io.github.modelDesign.project.service.TaskTypeService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 项目任务对外 API 适配测试。
 */
class ProjectTaskApiImplTest {
    /**
     * 列表查询应把 API 请求转成 project 服务请求。
     */
    @Test
    void queryTasksShouldDelegateToProjectService() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo task = ProjectTaskDetailVo.builder()
                .id(101L)
                .projectId(10L)
                .projectName("演示项目")
                .title("接入 MCP 任务工具")
                .status("todo")
                .priority("high")
                .build();
        when(projectTaskService.getList(any(ProjectTaskListRequest.class)))
                .thenReturn(new PageResponse<>(List.of(task), 1L));

        ProjectTaskQueryRequest request = new ProjectTaskQueryRequest();
        request.setProjectId(10L);
        request.setCurrent(2);
        request.setPageSize(20);
        request.setAssigneeId(88L);

        PageResult<ProjectTaskDto> result = api.queryTasks(request);

        assertEquals(1L, result.getTotal());
        assertEquals(1, result.getItems().size());
        assertEquals(101L, result.getItems().get(0).getId());

        ArgumentCaptor<ProjectTaskListRequest> captor =
                ArgumentCaptor.forClass(ProjectTaskListRequest.class);
        verify(projectTaskService).getList(captor.capture());
        ProjectTaskListRequest captured = captor.getValue();
        assertEquals(10L, captured.getProjectId());
        assertEquals(2, captured.getCurrent());
        assertEquals(20, captured.getPageSize());
        assertEquals(88L, captured.getAssigneeId());
    }

    /**
     * 详情查询应直接映射成对外 DTO。
     */
    @Test
    void getTaskDetailShouldDelegateToProjectService() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo task = ProjectTaskDetailVo.builder()
                .id(102L)
                .title("查看任务详情")
                .status("todo")
                .projectId(20L)
                .projectName("演示项目")
                .build();
        when(projectTaskService.getDetail(102L)).thenReturn(task);

        ProjectTaskDto result = api.getTaskDetail(102L);

        assertEquals(102L, result.getId());
        assertEquals("查看任务详情", result.getTitle());
        assertEquals("todo", result.getStatus());
        assertEquals(20L, result.getProjectId());
    }

    /**
     * 状态更新应复用当前详情字段，只覆盖状态本身。
     */
    @Test
    void updateTaskStatusShouldReuseCurrentDetailFields() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo currentTask = ProjectTaskDetailVo.builder()
                .id(200L)
                .projectId(10L)
                .title("补充任务状态工具")
                .description("现有编辑接口要求完整字段")
                .typeId(3L)
                .status("todo")
                .priority("medium")
                .assigneeId(0L)
                .workDays(new BigDecimal("2.5"))
                .startTime("2026-04-20 10:00:00")
                .dueTime("2026-04-21 18:00:00")
                .predecessorTaskIds(List.of(1L, 2L))
                .tagIds(List.of(9L))
                .build();
        ProjectTaskDetailVo updatedTask = ProjectTaskDetailVo.builder()
                .id(200L)
                .status("inProgress")
                .title("补充任务状态工具")
                .build();
        when(projectTaskService.getDetail(200L)).thenReturn(currentTask);
        when(projectTaskService.edit(any(Long.class), any(ProjectTaskEditRequest.class)))
                .thenReturn(updatedTask);

        ProjectTaskStatusUpdateCommand command =
                new ProjectTaskStatusUpdateCommand();
        command.setTaskId(200L);
        command.setStatus("inProgress");

        ProjectTaskDto result = api.updateTaskStatus(command);

        assertEquals("inProgress", result.getStatus());
        ArgumentCaptor<ProjectTaskEditRequest> captor =
                ArgumentCaptor.forClass(ProjectTaskEditRequest.class);
        verify(projectTaskService).edit(org.mockito.ArgumentMatchers.eq(200L),
                captor.capture());
        ProjectTaskEditRequest captured = captor.getValue();
        assertEquals("补充任务状态工具", captured.getTitle());
        assertEquals("现有编辑接口要求完整字段", captured.getDescription());
        assertEquals(3L, captured.getTypeId());
        assertEquals("inProgress", captured.getStatus());
        assertEquals("medium", captured.getPriority());
        assertNull(captured.getAssigneeId());
        assertEquals(
                LocalDateTime.of(2026, 4, 20, 10, 0, 0),
                captured.getStartTime()
        );
        assertEquals(
                LocalDateTime.of(2026, 4, 21, 18, 0, 0),
                captured.getDueTime()
        );
    }

    /**
     * 我的待办查询应转成外部分页结果。
     */
    @Test
    void queryMyTodoShouldMapPageResponse() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        MyTodoItemVo todo = MyTodoItemVo.builder()
                .id(301L)
                .title("处理待办")
                .projectId(50L)
                .projectName("平台项目")
                .status("todo")
                .build();
        when(projectTaskService.getMyTodoList(any(MyTodoListRequest.class)))
                .thenReturn(new PageResponse<>(List.of(todo), 1L));

        ProjectTaskMyTodoRequest request = new ProjectTaskMyTodoRequest();
        request.setCurrent(3);
        request.setPageSize(5);

        PageResult<MyTodoTaskDto> result = api.queryMyTodo(request);

        assertEquals(1L, result.getTotal());
        assertEquals(301L, result.getItems().get(0).getId());

        ArgumentCaptor<MyTodoListRequest> captor =
                ArgumentCaptor.forClass(MyTodoListRequest.class);
        verify(projectTaskService).getMyTodoList(captor.capture());
        assertEquals(3, captor.getValue().getCurrent());
        assertEquals(5, captor.getValue().getPageSize());
    }

    /**
     * 创建任务应直接委托 project 服务。
     */
    @Test
    void createTaskShouldDelegateToProjectService() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskDynamicService projectTaskDynamicService =
                mock(ProjectTaskDynamicService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                projectTaskDynamicService,
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo createdTask = ProjectTaskDetailVo.builder()
                .id(401L)
                .title("创建任务")
                .status("todo")
                .build();
        when(projectTaskService.create(any(ProjectTaskCreateRequest.class)))
                .thenReturn(createdTask);

        ProjectTaskCreateCommand command = new ProjectTaskCreateCommand();
        command.setProjectId(10L);
        command.setTitle("创建任务");
        command.setTypeId(2L);
        command.setStatus("todo");
        command.setPriority("medium");

        ProjectTaskDto result = api.createTask(command);

        assertEquals(401L, result.getId());

        ArgumentCaptor<ProjectTaskCreateRequest> captor =
                ArgumentCaptor.forClass(ProjectTaskCreateRequest.class);
        verify(projectTaskService).create(captor.capture());
        ProjectTaskCreateRequest captured = captor.getValue();
        assertEquals(10L, captured.getProjectId());
        assertEquals("创建任务", captured.getTitle());
        assertEquals(2L, captured.getTypeId());
        assertEquals("todo", captured.getStatus());
        assertEquals("medium", captured.getPriority());
    }

    /**
     * 完成任务应推进状态并补充开发完成动态。
     */
    @Test
    void completeTaskShouldUpdateStatusAndCreateDynamic() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskDynamicService projectTaskDynamicService =
                mock(ProjectTaskDynamicService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                projectTaskDynamicService,
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo currentTask = ProjectTaskDetailVo.builder()
                .id(500L)
                .title("完成开发闭环")
                .typeId(3L)
                .status("inProgress")
                .priority("high")
                .build();
        ProjectTaskDetailVo updatedTask = ProjectTaskDetailVo.builder()
                .id(500L)
                .title("完成开发闭环")
                .status("pendingTest")
                .build();
        when(projectTaskService.getDetail(500L)).thenReturn(currentTask);
        when(projectTaskService.edit(any(Long.class), any(ProjectTaskEditRequest.class)))
                .thenReturn(updatedTask);

        ProjectTaskCompleteCommand command = new ProjectTaskCompleteCommand();
        command.setTaskId(500L);
        command.setCompletionSummary("接口与单测已完成");
        command.setMentionedUserIds(List.of(7002L));

        ProjectTaskDto result = api.completeTask(command);

        assertEquals("pendingTest", result.getStatus());

        ArgumentCaptor<ProjectTaskEditRequest> editCaptor =
                ArgumentCaptor.forClass(ProjectTaskEditRequest.class);
        verify(projectTaskService).edit(
                org.mockito.ArgumentMatchers.eq(500L),
                editCaptor.capture()
        );
        assertEquals("pendingTest", editCaptor.getValue().getStatus());

        ArgumentCaptor<ProjectTaskDynamicCreateRequest> dynamicCaptor =
                ArgumentCaptor.forClass(ProjectTaskDynamicCreateRequest.class);
        verify(projectTaskDynamicService).create(dynamicCaptor.capture());
        assertEquals(500L, dynamicCaptor.getValue().getTaskId());
        assertEquals(
                "开发已完成，待发布测试。" + System.lineSeparator()
                        + "开发总结：接口与单测已完成",
                dynamicCaptor.getValue().getContent()
        );
        assertEquals(List.of(7002L), dynamicCaptor.getValue().getMentionedUserIds());
    }

    /**
     * 类型查询应复用现有任务类型服务结果。
     */
    @Test
    void queryTaskTypesShouldDelegateToTaskTypeService() {
        TaskTypeService taskTypeService = mock(TaskTypeService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                mock(ProjectTaskService.class),
                mock(ProjectTaskDynamicService.class),
                taskTypeService,
                mock(ProjectTaskWorkReportService.class)
        );

        when(taskTypeService.getList(any())).thenReturn(List.of(
                ProjectTaskTypeVo.builder()
                        .id(1L)
                        .name("任务")
                        .sort(1)
                        .build(),
                ProjectTaskTypeVo.builder()
                        .id(2L)
                        .name("缺陷")
                        .sort(2)
                        .build()
        ));

        List<ProjectTaskTypeDto> result = api.queryTaskTypes("任");

        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("任务", result.get(0).getName());
        assertEquals(2L, result.get(1).getId());
    }

    /**
     * 编号详情查询应复用 project 服务现有编号解析逻辑。
     */
    @Test
    void getTaskDetailByCodeShouldDelegateToProjectTaskService() {
        ProjectTaskService projectTaskService = mock(ProjectTaskService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                projectTaskService,
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                mock(ProjectTaskWorkReportService.class)
        );

        ProjectTaskDetailVo detail = ProjectTaskDetailVo.builder()
                .id(808L)
                .title("按编号直接开工")
                .status("todo")
                .build();
        when(projectTaskService.getDetailByCode("TASK-808")).thenReturn(detail);

        ProjectTaskDto result = api.getTaskDetailByCode("TASK-808");

        assertEquals(808L, result.getId());
        assertEquals("按编号直接开工", result.getTitle());
        assertEquals("todo", result.getStatus());
    }

    /**
     * 工作汇报生成应直接委托汇报服务。
     */
    @Test
    void generateWorkReportShouldDelegateToReportService() {
        ProjectTaskWorkReportService reportService =
                mock(ProjectTaskWorkReportService.class);
        ProjectTaskApiImpl api = new ProjectTaskApiImpl(
                mock(ProjectTaskService.class),
                mock(ProjectTaskDynamicService.class),
                mock(TaskTypeService.class),
                reportService
        );

        ProjectTaskWorkReportCommand command = new ProjectTaskWorkReportCommand();
        command.setReportType("daily");
        ProjectTaskWorkReportDto report = ProjectTaskWorkReportDto.builder()
                .reportType("daily")
                .reportTitle("日报（2026-04-22）")
                .build();
        when(reportService.generateCurrentUserReport(command)).thenReturn(report);

        ProjectTaskWorkReportDto result = api.generateWorkReport(command);

        assertEquals("日报（2026-04-22）", result.getReportTitle());
        verify(reportService).generateCurrentUserReport(command);
    }
}
