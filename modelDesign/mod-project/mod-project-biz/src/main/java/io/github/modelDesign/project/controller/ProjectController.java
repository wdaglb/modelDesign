package io.github.modelDesign.project.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.project.request.ProjectCreateRequest;
import io.github.modelDesign.project.request.ProjectDeleteRequest;
import io.github.modelDesign.project.request.ProjectEditRequest;
import io.github.modelDesign.project.request.ProjectListRequest;
import io.github.modelDesign.project.response.ProjectDetailVo;
import io.github.modelDesign.project.response.ProjectListResponse;
import io.github.modelDesign.project.service.ProjectService;
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
 * 项目接口。
 */
@Tag(name = "项目管理")
@RestController
@RequestMapping("/project")
@RequiredArgsConstructor
@Validated
public class ProjectController {
    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 获取项目列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取项目列表")
    @RequirePermission(PermissionResource.PROJECT)
    @GetMapping("/list")
    public ProjectListResponse list(@Valid ProjectListRequest request) {
        return projectService.getList(request);
    }

    /**
     * 获取项目详情。
     *
     * @param id 项目 ID
     * @return 项目详情
     */
    @Operation(summary = "获取项目详情")
    @RequirePermission(PermissionResource.PROJECT)
    @GetMapping("/detail")
    public ProjectDetailVo detail(@Parameter(description = "项目 ID", required = true) @RequestParam @NotNull(message = "项目 ID 不能为空") Long id) {
        return projectService.getDetail(id);
    }

    /**
     * 创建项目。
     *
     * @param request 创建请求
     * @return 项目详情
     */
    @Operation(summary = "创建项目")
    @PostMapping("/create")
    public ProjectDetailVo create(@Valid @RequestBody ProjectCreateRequest request) {
        return projectService.create(request);
    }

    /**
     * 编辑项目。
     *
     * @param id 项目 ID
     * @param request 编辑请求
     * @return 项目详情
     */
    @Operation(summary = "编辑项目")
    @PostMapping("/edit")
    public ProjectDetailVo edit(@Parameter(description = "项目 ID", required = true) @RequestParam @NotNull(message = "项目 ID 不能为空") Long id, @Valid @RequestBody ProjectEditRequest request) {
        return projectService.edit(id, request);
    }

    /**
     * 删除项目。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Operation(summary = "删除项目")
    @PostMapping("/deleted")
    public Integer deleted(@Valid @RequestBody ProjectDeleteRequest request) {
        return projectService.deleted(request.getIds());
    }
}
