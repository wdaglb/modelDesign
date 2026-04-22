package io.github.modelDesign.tools;

import io.github.modelDesign.project.api.ProjectTaskApi;
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
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDynamicDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportTaskDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Spring AI 任务工具测试。
 */
class ProjectTaskToolsTest {
    /**
     * 列表工具应补齐分页默认值并透传筛选条件。
     */
    @Test
    void queryProjectTasksShouldApplyDefaultPaging() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        tools.queryProjectTasks(10L, null, null, "MCP", null,
                "todo", "high", 99L, "priority", "desc");

        assertEquals(10L, projectTaskApi.queryRequest.getProjectId());
        assertEquals(1, projectTaskApi.queryRequest.getCurrent());
        assertEquals(10, projectTaskApi.queryRequest.getPageSize());
        assertEquals("MCP", projectTaskApi.queryRequest.getTitle());
        assertEquals("todo", projectTaskApi.queryRequest.getStatus());
        assertEquals("high", projectTaskApi.queryRequest.getPriority());
        assertEquals(99L, projectTaskApi.queryRequest.getAssigneeId());
    }

    /**
     * 类型查询工具应直接复用任务类型 API。
     */
    @Test
    void queryProjectTaskTypesShouldDelegateToApi() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.taskTypes = List.of(
                ProjectTaskTypeDto.builder()
                        .id(1L)
                        .name("任务")
                        .sort(1)
                        .build()
        );
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        List<ProjectTaskTypeDto> result = tools.queryProjectTaskTypes("任");

        assertEquals("任", projectTaskApi.taskTypeNameKeyword);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("任务", result.get(0).getName());
    }

    /**
     * 编号详情工具应把任务编号透传给公共 API。
     */
    @Test
    void getProjectTaskDetailByCodeShouldDelegateToApi() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.taskDetailByCode = ProjectTaskDto.builder()
                .id(808L)
                .title("按编号开工")
                .status("todo")
                .build();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        ProjectTaskDto result = tools.getProjectTaskDetailByCode("TASK-808");

        assertEquals("TASK-808", projectTaskApi.taskCode);
        assertEquals(808L, result.getId());
        assertEquals("按编号开工", result.getTitle());
    }

    /**
     * 创建工具应把文本时间转换成 LocalDateTime。
     */
    @Test
    void createProjectTaskShouldParseDateTime() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        tools.createProjectTask(
                10L,
                "接入工具",
                2L,
                "todo",
                "medium",
                "描述",
                0L,
                new BigDecimal("1.5"),
                "2026-04-20 09:00:00",
                "2026-04-21 18:30:00",
                null
        );

        assertEquals(10L, projectTaskApi.createCommand.getProjectId());
        assertEquals("接入工具", projectTaskApi.createCommand.getTitle());
        assertEquals(
                LocalDateTime.of(2026, 4, 20, 9, 0, 0),
                projectTaskApi.createCommand.getStartTime()
        );
        assertEquals(
                LocalDateTime.of(2026, 4, 21, 18, 30, 0),
                projectTaskApi.createCommand.getDueTime()
        );
        assertEquals(0L, projectTaskApi.createCommand.getAssigneeId());
    }

    /**
     * 状态工具应只提交任务 ID 与目标状态。
     */
    @Test
    void updateProjectTaskStatusShouldDelegateCommand() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        ProjectTaskDto result = tools.updateProjectTaskStatus(88L, "done");

        assertEquals("done", result.getStatus());
        assertEquals(88L, projectTaskApi.statusUpdateCommand.getTaskId());
        assertEquals("done", projectTaskApi.statusUpdateCommand.getStatus());
    }

    /**
     * 开始任务工具应生成分支建议，并在可开始时自动推进状态。
     */
    @Test
    void startProjectTaskShouldGenerateBranchAndUpdateStatus() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.taskDetail = ProjectTaskDto.builder()
                .id(66L)
                .title("实现 MCP 开始任务工具")
                .status("todo")
                .canStart(true)
                .build();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        TaskStartGuide result = tools.startProjectTask(66L, "King East", null);

        assertEquals(
                "feat/king-east/task-66-mcp",
                result.getRecommendedBranchName()
        );
        assertEquals("todo", result.getCurrentStatus());
        assertEquals("inProgress", result.getTargetStatus());
        assertEquals(66L, projectTaskApi.statusUpdateCommand.getTaskId());
        assertEquals("inProgress", projectTaskApi.statusUpdateCommand.getStatus());
    }

    /**
     * 被阻塞的任务不应自动推进状态，而应返回阻塞提示。
     */
    @Test
    void startProjectTaskShouldReturnBlockedGuideWhenTaskCannotStart() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.taskDetail = ProjectTaskDto.builder()
                .id(77L)
                .title("等待前置任务")
                .status("todo")
                .canStart(false)
                .blockedReason("前置任务未完成")
                .build();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        TaskStartGuide result = tools.startProjectTask(77L, null, true);

        assertEquals(false, result.getCanStart());
        assertEquals("todo", result.getTargetStatus());
        assertEquals("前置任务未完成", result.getBlockedReason());
        assertNull(projectTaskApi.statusUpdateCommand);
    }

    /**
     * 完成任务工具应推进状态并写入完成动态。
     */
    @Test
    void completeProjectTaskShouldDelegateCompletionCommand() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.taskDetail = ProjectTaskDto.builder()
                .id(90L)
                .title("完成开发任务")
                .status("inProgress")
                .build();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        TaskCompleteGuide result = tools.completeProjectTask(
                90L,
                "接口、自测与文档已完成",
                java.util.List.of(7002L)
        );

        assertEquals("inProgress", result.getCurrentStatus());
        assertEquals("pendingTest", result.getTargetStatus());
        assertEquals(
                "开发已完成，待发布测试。" + System.lineSeparator()
                        + "开发总结：接口、自测与文档已完成",
                result.getDynamicContent()
        );
        assertEquals(90L, projectTaskApi.completeCommand.getTaskId());
        assertEquals(
                "接口、自测与文档已完成",
                projectTaskApi.completeCommand.getCompletionSummary()
        );
        assertEquals(
                java.util.List.of(7002L),
                projectTaskApi.completeCommand.getMentionedUserIds()
        );
    }

    /**
     * 我的待办工具应对非法分页值回退到默认值。
     */
    @Test
    void queryMyTodoTasksShouldFallbackToDefaultPaging() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        tools.queryMyTodoTasks(0, -1, null, null, null);

        assertEquals(1, projectTaskApi.myTodoRequest.getCurrent());
        assertEquals(10, projectTaskApi.myTodoRequest.getPageSize());
        assertNull(projectTaskApi.myTodoRequest.getTitle());
    }

    /**
     * 日报工具应按指定日期生成任务与动态文本。
     */
    @Test
    void generateDailyReportShouldBuildReadableText() {
        RecordingProjectTaskApi projectTaskApi = new RecordingProjectTaskApi();
        projectTaskApi.workReport = ProjectTaskWorkReportDto.builder()
                .reportType("daily")
                .reportTitle("日报（2026-04-22）")
                .periodStart("2026-04-22 00:00:00")
                .periodEnd("2026-04-22 23:59:59")
                .tasks(List.of(
                        ProjectTaskWorkReportTaskDto.builder()
                                .id(88L)
                                .projectName("平台项目")
                                .title("补充日报生成")
                                .participationRole("成员")
                                .status("inProgress")
                                .priority("high")
                                .updatedAt("2026-04-22 18:30:00")
                                .latestDynamicSummary("已同步测试风险")
                                .build()
                ))
                .dynamics(List.of(
                        ProjectTaskWorkReportDynamicDto.builder()
                                .taskId(88L)
                                .projectName("平台项目")
                                .taskTitle("补充日报生成")
                                .operatorName("张三")
                                .createdAt("2026-04-22 18:00:00")
                                .content("已同步测试风险")
                                .build()
                ))
                .build();
        ProjectTaskTools tools = new ProjectTaskTools(projectTaskApi);

        String result = tools.generateDailyReport("2026-04-22");

        assertEquals("daily", projectTaskApi.workReportCommand.getReportType());
        assertEquals(LocalDate.of(2026, 4, 22),
                projectTaskApi.workReportCommand.getReferenceDate());
        assertTrue(result.contains("日报（2026-04-22）"));
        assertTrue(result.contains("参与身份：成员"));
        assertTrue(result.contains("张三：已同步测试风险"));
    }

    /**
     * 记录工具调用入参的简易 API 假实现。
     */
    private static class RecordingProjectTaskApi implements ProjectTaskApi {
        /**
         * 最近一次任务查询请求。
         */
        private ProjectTaskQueryRequest queryRequest;

        /**
         * 最近一次任务创建命令。
         */
        private ProjectTaskCreateCommand createCommand;

        /**
         * 最近一次状态更新命令。
         */
        private ProjectTaskStatusUpdateCommand statusUpdateCommand;

        /**
         * 最近一次任务完成命令。
         */
        private ProjectTaskCompleteCommand completeCommand;

        /**
         * 最近一次任务类型关键字。
         */
        private String taskTypeNameKeyword;

        /**
         * 最近一次任务类型列表结果。
         */
        private List<ProjectTaskTypeDto> taskTypes = Collections.emptyList();

        /**
         * 最近一次按编号查询的编号。
         */
        private String taskCode;

        /**
         * 最近一次按编号查询结果。
         */
        private ProjectTaskDto taskDetailByCode =
                ProjectTaskDto.builder().id(1L).build();

        /**
         * 最近一次任务详情结果。
         */
        private ProjectTaskDto taskDetail =
                ProjectTaskDto.builder()
                        .id(1L)
                        .title("默认任务")
                        .status("todo")
                        .canStart(true)
                        .build();

        /**
         * 最近一次待办查询请求。
         */
        private ProjectTaskMyTodoRequest myTodoRequest;

        /**
         * 最近一次工作汇报命令。
         */
        private ProjectTaskWorkReportCommand workReportCommand;

        /**
         * 最近一次工作汇报结果。
         */
        private ProjectTaskWorkReportDto workReport = ProjectTaskWorkReportDto.builder()
                .reportType("daily")
                .reportTitle("日报")
                .periodStart("2026-04-22 00:00:00")
                .periodEnd("2026-04-22 23:59:59")
                .tasks(Collections.emptyList())
                .dynamics(Collections.emptyList())
                .build();

        /**
         * 查询任务。
         *
         * @param request 查询条件
         * @return 空分页
         */
        @Override
        public PageResult<ProjectTaskDto> queryTasks(ProjectTaskQueryRequest request) {
            this.queryRequest = request;
            return new PageResult<>(Collections.emptyList(), 0L);
        }

        /**
         * 查询任务类型。
         *
         * @param name 类型名称关键字
         * @return 固定类型结果
         */
        @Override
        public List<ProjectTaskTypeDto> queryTaskTypes(String name) {
            this.taskTypeNameKeyword = name;
            return taskTypes;
        }

        /**
         * 查询任务详情。
         *
         * @param taskId 任务 ID
         * @return 固定任务详情
         */
        @Override
        public ProjectTaskDto getTaskDetail(Long taskId) {
            return taskDetail;
        }

        /**
         * 按编号查询任务详情。
         *
         * @param code 任务编号
         * @return 固定详情结果
         */
        @Override
        public ProjectTaskDto getTaskDetailByCode(String code) {
            this.taskCode = code;
            return taskDetailByCode;
        }

        /**
         * 创建任务。
         *
         * @param command 创建命令
         * @return 固定任务结果
         */
        @Override
        public ProjectTaskDto createTask(ProjectTaskCreateCommand command) {
            this.createCommand = command;
            return ProjectTaskDto.builder().id(1L).build();
        }

        /**
         * 完成任务。
         *
         * @param command 完成任务命令
         * @return 固定任务结果
         */
        @Override
        public ProjectTaskDto completeTask(ProjectTaskCompleteCommand command) {
            this.completeCommand = command;
            return ProjectTaskDto.builder()
                    .id(command.getTaskId())
                    .title(taskDetail.getTitle())
                    .status("pendingTest")
                    .build();
        }

        /**
         * 更新任务状态。
         *
         * @param command 状态更新命令
         * @return 固定任务结果
         */
        @Override
        public ProjectTaskDto updateTaskStatus(
                ProjectTaskStatusUpdateCommand command) {
            this.statusUpdateCommand = command;
            return ProjectTaskDto.builder()
                    .id(command.getTaskId())
                    .title(taskDetail.getTitle())
                    .status(command.getStatus())
                    .canStart(taskDetail.getCanStart())
                    .blockedReason(taskDetail.getBlockedReason())
                    .build();
        }

        /**
         * 查询待办。
         *
         * @param request 查询条件
         * @return 空分页
         */
        @Override
        public PageResult<MyTodoTaskDto> queryMyTodo(
                ProjectTaskMyTodoRequest request) {
            this.myTodoRequest = request;
            return new PageResult<>(Collections.emptyList(), 0L);
        }

        /**
         * 生成工作汇报。
         *
         * @param command 汇报命令
         * @return 固定汇报结果
         */
        @Override
        public ProjectTaskWorkReportDto generateWorkReport(
                ProjectTaskWorkReportCommand command) {
            this.workReportCommand = command;
            return workReport;
        }
    }
}
