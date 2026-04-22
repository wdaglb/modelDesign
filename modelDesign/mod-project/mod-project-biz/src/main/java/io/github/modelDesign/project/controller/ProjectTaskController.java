package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDynamicDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportTaskDto;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskBoardRequest;
import io.github.modelDesign.project.request.ProjectTaskChangeLogListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDeleteRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.request.ProjectTaskWorkReportGenerateRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskChangeLogItemVo;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import io.github.modelDesign.project.response.ProjectTaskWorkReportDynamicVo;
import io.github.modelDesign.project.response.ProjectTaskWorkReportTaskVo;
import io.github.modelDesign.project.response.ProjectTaskWorkReportVo;
import io.github.modelDesign.project.service.ProjectTaskBoardQueryService;
import io.github.modelDesign.project.service.ProjectTaskService;
import io.github.modelDesign.project.service.ProjectTaskWorkReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

/**
 * 项目任务接口。
 */
@Tag(name = "项目任务")
@RestController
@RequestMapping("/project/task")
@RequiredArgsConstructor
@Validated
public class ProjectTaskController {
    /**
     * 项目任务服务。
     */
    private final ProjectTaskService projectTaskService;

    /**
     * 项目任务敏捷面板查询服务。
     */
    private final ProjectTaskBoardQueryService projectTaskBoardQueryService;

    /**
     * 任务工作报表服务。
     */
    private final ProjectTaskWorkReportService projectTaskWorkReportService;

    /**
     * 获取我的待办列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取我的待办列表")
    @GetMapping("/my-todo")
    public PageResponse<MyTodoItemVo> myTodo(@Valid MyTodoListRequest request) {
        return projectTaskService.getMyTodoList(request);
    }

    /**
     * 获取任务列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取任务列表")
    @GetMapping("/list")
    public PageResponse<ProjectTaskDetailVo> list(@Valid ProjectTaskListRequest request) {
        return projectTaskService.getList(request);
    }

    /**
     * 生成当前登录用户的任务工作报表。
     *
     * 这里统一暴露日报、周报、月报、年报四种周期，
     * 让前端或第三方调用方不必依赖 AI 对话入口也能直接获取结构化报表数据。
     *
     * @param request 报表生成请求
     * @return 工作报表结果
     */
    @Operation(summary = "生成任务工作报表")
    @GetMapping("/report/generate")
    public ProjectTaskWorkReportVo generateReport(
            @Valid ProjectTaskWorkReportGenerateRequest request) {
        ProjectTaskWorkReportCommand command = new ProjectTaskWorkReportCommand();
        command.setReportType(request.getReportType());
        command.setReferenceDate(request.getReferenceDate());
        ProjectTaskWorkReportDto report =
                projectTaskWorkReportService.generateCurrentUserReport(command);
        return toWorkReportVo(report);
    }

    /**
     * 获取敏捷面板任务列表。
     *
     * @param request 列表请求
     * @return 任务列表
     */
    @Operation(summary = "获取敏捷面板任务列表")
    @GetMapping("/board")
    public List<ProjectTaskDetailVo> board(@Valid ProjectTaskBoardRequest request) {
        return projectTaskBoardQueryService.getBoard(request);
    }

    /**
     * 获取敏捷面板专用任务列表。
     *
     * @param request 列表请求
     * @return 按优先级排序的任务列表
     */
    @Operation(summary = "获取敏捷面板专用任务列表（按优先级从高到低排序）")
    @GetMapping("/agile-board")
    public List<ProjectTaskDetailVo> agileBoard(@Valid ProjectTaskBoardRequest request) {
        return projectTaskBoardQueryService.getAgileBoard(request);
    }

    /**
     * 获取任务详情。
     *
     * @param id 任务 ID
     * @return 任务详情
     */
    @Operation(summary = "获取任务详情")
    @GetMapping("/detail")
    public ProjectTaskDetailVo detail(@Parameter(description = "任务 ID", required = true) @RequestParam @NotNull(message = "任务 ID 不能为空") Long id) {
        return projectTaskService.getDetail(id);
    }

    /**
     * 获取子任务列表。
     *
     * @param parentTaskId 父任务 ID
     * @return 子任务列表
     */
    @Operation(summary = "获取子任务列表")
    @GetMapping("/children")
    public List<ProjectTaskDetailVo> children(@Parameter(description = "父任务 ID", required = true) @RequestParam @NotNull(message = "父任务 ID 不能为空") Long parentTaskId) {
        return projectTaskService.getChildren(parentTaskId);
    }

    /**
     * 批量获取子任务列表。
     *
     * @param parentTaskIds 父任务 ID 列表
     * @return 子任务列表
     */
    @Operation(summary = "批量获取子任务列表")
    @GetMapping("/children/batch")
    public List<ProjectTaskDetailVo> childrenBatch(
            @Parameter(description = "父任务 ID 列表", required = true)
            @RequestParam
            @NotEmpty(message = "父任务 ID 列表不能为空")
            List<Long> parentTaskIds) {
        return projectTaskService.getChildrenBatch(parentTaskIds);
    }

    /**
     * 按编号获取任务详情。
     *
     * @param code 任务编号
     * @return 任务详情
     */
    @Operation(summary = "按编号获取任务详情")
    @GetMapping("/detail/by-code")
    public ProjectTaskDetailVo detailByCode(
            @Parameter(description = "任务编号", required = true)
            @RequestParam
            @NotBlank(message = "任务编号不能为空")
            String code) {
        return projectTaskService.getDetailByCode(code);
    }

    /**
     * 获取任务变更日志列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取任务变更日志列表")
    @GetMapping("/change-log/list")
    public PageResponse<ProjectTaskChangeLogItemVo> changeLogList(@Valid ProjectTaskChangeLogListRequest request) {
        return projectTaskService.getChangeLogList(request);
    }

    /**
     * 创建任务。
     *
     * @param request 创建请求
     * @return 任务详情
     */
    @Operation(summary = "创建任务")
    @PostMapping("/create")
    public ProjectTaskDetailVo create(@Valid @RequestBody ProjectTaskCreateRequest request) {
        return projectTaskService.create(request);
    }

    /**
     * 编辑任务。
     *
     * @param id 任务 ID
     * @param request 编辑请求
     * @return 任务详情
     */
    @Operation(summary = "编辑任务")
    @PostMapping("/edit")
    public ProjectTaskDetailVo edit(@Parameter(description = "任务 ID", required = true) @RequestParam @NotNull(message = "任务 ID 不能为空") Long id, @Valid @RequestBody ProjectTaskEditRequest request) {
        return projectTaskService.edit(id, request);
    }

    /**
     * 删除任务。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Operation(summary = "删除任务")
    @PostMapping("/deleted")
    public Integer deleted(@Valid @RequestBody ProjectTaskDeleteRequest request) {
        return projectTaskService.deleted(request.getIds());
    }

    /**
     * 把工作报表 DTO 转成控制器输出对象。
     *
     * 这里单独做一层映射，避免把 API 聚合层 DTO 直接暴露到 HTTP 契约，
     * 后续若接口字段需要单独演进，也不会反向牵连内部公共 API。
     *
     * @param report 工作报表 DTO
     * @return 控制器输出对象
     */
    private ProjectTaskWorkReportVo toWorkReportVo(
            ProjectTaskWorkReportDto report) {
        return ProjectTaskWorkReportVo.builder()
                .reportType(report.getReportType())
                .reportTitle(report.getReportTitle())
                .periodStart(report.getPeriodStart())
                .periodEnd(report.getPeriodEnd())
                .tasks(toWorkReportTaskVoList(report.getTasks()))
                .dynamics(toWorkReportDynamicVoList(report.getDynamics()))
                .build();
    }

    /**
     * 转换工作报表任务列表。
     *
     * @param tasks 任务 DTO 列表
     * @return 任务 VO 列表
     */
    private List<ProjectTaskWorkReportTaskVo> toWorkReportTaskVoList(
            List<ProjectTaskWorkReportTaskDto> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyList();
        }
        return tasks.stream()
                .map(task -> ProjectTaskWorkReportTaskVo.builder()
                        .id(task.getId())
                        .projectName(task.getProjectName())
                        .title(task.getTitle())
                        .participationRole(task.getParticipationRole())
                        .status(task.getStatus())
                        .priority(task.getPriority())
                        .updatedAt(task.getUpdatedAt())
                        .latestDynamicSummary(task.getLatestDynamicSummary())
                        .build())
                .toList();
    }

    /**
     * 转换工作报表动态列表。
     *
     * @param dynamics 动态 DTO 列表
     * @return 动态 VO 列表
     */
    private List<ProjectTaskWorkReportDynamicVo> toWorkReportDynamicVoList(
            List<ProjectTaskWorkReportDynamicDto> dynamics) {
        if (dynamics == null || dynamics.isEmpty()) {
            return Collections.emptyList();
        }
        return dynamics.stream()
                .map(dynamic -> ProjectTaskWorkReportDynamicVo.builder()
                        .taskId(dynamic.getTaskId())
                        .projectName(dynamic.getProjectName())
                        .taskTitle(dynamic.getTaskTitle())
                        .operatorName(dynamic.getOperatorName())
                        .createdAt(dynamic.getCreatedAt())
                        .content(dynamic.getContent())
                        .build())
                .toList();
    }
}
