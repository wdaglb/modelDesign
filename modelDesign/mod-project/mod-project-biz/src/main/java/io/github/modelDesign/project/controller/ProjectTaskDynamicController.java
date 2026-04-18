package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.ProjectTaskDynamicCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDynamicListRequest;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDynamicItemVo;
import io.github.modelDesign.project.service.ProjectTaskDynamicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 项目任务动态接口。
 */
@Tag(name = "项目任务动态")
@RestController
@RequestMapping("/project/task/dynamic")
@RequiredArgsConstructor
@Validated
public class ProjectTaskDynamicController {
    /**
     * 任务动态服务。
     */
    private final ProjectTaskDynamicService projectTaskDynamicService;

    /**
     * 获取任务动态列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取任务动态列表")
    @GetMapping("/list")
    public PageResponse<ProjectTaskDynamicItemVo> list(
            @Valid ProjectTaskDynamicListRequest request) {
        return projectTaskDynamicService.getList(request);
    }

    /**
     * 创建任务动态。
     *
     * @param request 创建请求
     * @return 动态详情
     */
    @Operation(summary = "创建任务动态")
    @PostMapping("/create")
    public ProjectTaskDynamicItemVo create(
            @Valid @RequestBody ProjectTaskDynamicCreateRequest request) {
        return projectTaskDynamicService.create(request);
    }
}
