package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.PermissionGroupAddRequest;
import io.github.modelDesign.auth.request.PermissionGroupDeleteRequest;
import io.github.modelDesign.auth.request.PermissionGroupListRequest;
import io.github.modelDesign.auth.request.PermissionGroupResourceUpdateRequest;
import io.github.modelDesign.auth.request.PermissionGroupUpdateRequest;
import io.github.modelDesign.auth.request.PermissionGroupUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.PermissionGroupListItemVo;
import io.github.modelDesign.auth.response.PermissionGroupResourceVo;
import io.github.modelDesign.auth.service.PermissionGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
 * 权限资源组管理接口。
 */
@Tag(name = "权限资源组管理")
@RestController
@RequestMapping("/permission-group")
@RequiredArgsConstructor
@Validated
public class PermissionGroupController {
    /**
     * 权限资源组服务。
     */
    private final PermissionGroupService permissionGroupService;

    /**
     * 获取资源组列表。
     */
    @Operation(summary = "获取资源组列表")
    @GetMapping("/list")
    public PageResponse<PermissionGroupListItemVo> list(@Valid PermissionGroupListRequest request) {
        return permissionGroupService.getList(request);
    }

    /**
     * 新增资源组。
     */
    @Operation(summary = "新增资源组")
    @PostMapping("/add")
    public PermissionGroupListItemVo add(@Valid @RequestBody PermissionGroupAddRequest request) {
        return permissionGroupService.add(request);
    }

    /**
     * 编辑资源组。
     */
    @Operation(summary = "编辑资源组")
    @PostMapping("/update")
    public PermissionGroupListItemVo update(
            @Parameter(description = "资源组 ID", required = true)
            @RequestParam
            @NotNull(message = "资源组 ID 不能为空")
            Long id,
            @Valid @RequestBody PermissionGroupUpdateRequest request) {
        return permissionGroupService.update(id, request);
    }

    /**
     * 更新资源组状态。
     */
    @Operation(summary = "更新资源组状态")
    @PostMapping("/update_status")
    public void updateStatus(@Valid @RequestBody PermissionGroupUpdateStatusRequest request) {
        permissionGroupService.updateStatus(request);
    }

    /**
     * 获取资源组资源列表。
     */
    @Operation(summary = "获取资源组资源列表")
    @GetMapping("/resources")
    public PermissionGroupResourceVo getResources(
            @Parameter(description = "资源组编码", required = true)
            @RequestParam
            @NotBlank(message = "资源组编码不能为空")
            String groupCode) {
        return permissionGroupService.getResources(groupCode);
    }

    /**
     * 更新资源组资源列表。
     */
    @Operation(summary = "更新资源组资源列表")
    @PostMapping("/resources/update")
    public void updateResources(
            @Parameter(description = "资源组编码", required = true)
            @RequestParam
            @NotBlank(message = "资源组编码不能为空")
            String groupCode,
            @Valid @RequestBody PermissionGroupResourceUpdateRequest request) {
        permissionGroupService.updateResources(
                groupCode,
                request.getMenuResources(),
                request.getApiResources()
        );
    }

    /**
     * 删除资源组。
     */
    @Operation(summary = "删除资源组")
    @PostMapping("/delete")
    public void delete(@Valid @RequestBody PermissionGroupDeleteRequest request) {
        permissionGroupService.delete(request);
    }
}
