package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDeleteRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import io.github.modelDesign.project.service.ProjectTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
