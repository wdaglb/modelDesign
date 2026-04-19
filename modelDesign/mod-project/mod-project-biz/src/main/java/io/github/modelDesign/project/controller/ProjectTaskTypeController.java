package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.ProjectTaskTypeCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeDeleteRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeEditRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeListRequest;
import io.github.modelDesign.project.response.ProjectTaskTypeVo;
import io.github.modelDesign.project.service.TaskTypeService;
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

import java.util.List;

/**
 * 任务类型管理接口。
 */
@Tag(name = "任务类型管理")
@RestController
@RequestMapping("/project/task-type")
@RequiredArgsConstructor
@Validated
public class ProjectTaskTypeController {
    /**
     * 任务类型服务。
     */
    private final TaskTypeService taskTypeService;

    /**
     * 获取任务类型列表。
     *
     * @param request 列表请求
     * @return 类型列表
     */
    @Operation(summary = "获取任务类型列表")
    @GetMapping("/list")
    public List<ProjectTaskTypeVo> list(@Valid ProjectTaskTypeListRequest request) {
        return taskTypeService.getList(request);
    }

    /**
     * 创建任务类型。
     *
     * @param request 创建请求
     * @return 类型详情
     */
    @Operation(summary = "创建任务类型")
    @PostMapping("/create")
    public ProjectTaskTypeVo create(@Valid @RequestBody ProjectTaskTypeCreateRequest request) {
        return taskTypeService.create(request);
    }

    /**
     * 编辑任务类型。
     *
     * @param id      类型 ID
     * @param request 编辑请求
     * @return 类型详情
     */
    @Operation(summary = "编辑任务类型")
    @PostMapping("/edit")
    public ProjectTaskTypeVo edit(
            @Parameter(description = "类型 ID", required = true)
            @RequestParam
            @NotNull(message = "类型 ID 不能为空")
            Long id,
            @Valid @RequestBody ProjectTaskTypeEditRequest request) {
        return taskTypeService.edit(id, request);
    }

    /**
     * 删除任务类型。
     *
     * @param request 删除请求
     * @return 删除结果
     */
    @Operation(summary = "删除任务类型")
    @PostMapping("/deleted")
    public Integer deleted(@Valid @RequestBody ProjectTaskTypeDeleteRequest request) {
        taskTypeService.deleted(request.getId());
        return 1;
    }
}
