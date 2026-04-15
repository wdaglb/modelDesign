package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.ProjectTaskTagCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskTagDeleteRequest;
import io.github.modelDesign.project.request.ProjectTaskTagEditRequest;
import io.github.modelDesign.project.request.ProjectTaskTagListRequest;
import io.github.modelDesign.project.response.ProjectTaskTagVo;
import io.github.modelDesign.project.service.TaskTagService;
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
 * 任务标签管理接口。
 */
@Tag(name = "任务标签管理")
@RestController
@RequestMapping("/project/task/tag")
@RequiredArgsConstructor
@Validated
public class ProjectTaskTagController {
    /**
     * 任务标签服务。
     */
    private final TaskTagService taskTagService;

    /**
     * 获取任务标签列表。
     *
     * @param request 列表请求
     * @return 标签列表
     */
    @Operation(summary = "获取任务标签列表")
    @GetMapping("/list")
    public List<ProjectTaskTagVo> list(@Valid ProjectTaskTagListRequest request) {
        return taskTagService.getList(request);
    }

    /**
     * 创建任务标签。
     *
     * @param request 创建请求
     * @return 标签详情
     */
    @Operation(summary = "创建任务标签")
    @PostMapping("/create")
    public ProjectTaskTagVo create(@Valid @RequestBody ProjectTaskTagCreateRequest request) {
        return taskTagService.create(request);
    }

    /**
     * 编辑任务标签。
     *
     * @param id      标签 ID
     * @param request 编辑请求
     * @return 标签详情
     */
    @Operation(summary = "编辑任务标签")
    @PostMapping("/edit")
    public ProjectTaskTagVo edit(@Parameter(description = "标签 ID", required = true) @RequestParam @NotNull(message = "标签 ID 不能为空") Long id,
                                 @Valid @RequestBody ProjectTaskTagEditRequest request) {
        return taskTagService.edit(id, request);
    }

    /**
     * 删除任务标签。
     *
     * @param request 删除请求
     * @return 删除结果
     */
    @Operation(summary = "删除任务标签")
    @PostMapping("/deleted")
    public Integer deleted(@Valid @RequestBody ProjectTaskTagDeleteRequest request) {
        taskTagService.deleted(request.getId());
        return 1;
    }
}
