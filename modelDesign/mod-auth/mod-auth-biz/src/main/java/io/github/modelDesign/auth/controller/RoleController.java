package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.request.RoleAddRequest;
import io.github.modelDesign.auth.request.RoleBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.RoleListRequest;
import io.github.modelDesign.auth.request.RolePermissionUpdateRequest;
import io.github.modelDesign.auth.request.RoleUpdateRequest;
import io.github.modelDesign.auth.request.RoleUpdateStatusRequest;
import io.github.modelDesign.auth.request.RoleUserUpdateRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.RoleListItemVo;
import io.github.modelDesign.auth.response.RolePermissionVo;
import io.github.modelDesign.auth.service.PermissionService;
import io.github.modelDesign.auth.service.RoleService;
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

import java.util.List;

/**
 * 角色管理接口。
 *
 * 提供后台角色列表查询、添加、编辑以及状态切换能力。
 * 当前删除语义已经收敛为禁用/启用，因此这里不提供物理删除接口。
 */
@Tag(name = "角色管理")
@RestController
@RequestMapping("/role")
@RequiredArgsConstructor
@Validated
public class RoleController {
    /**
     * 角色服务。
     */
    private final RoleService roleService;

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 获取角色列表。
     *
     * 支持按名称和编码关键字查询，并返回分页结构给前端列表页使用。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取角色列表")
    @RequirePermission(anyOf = {
            PermissionResource.SYSTEM_ROLE,
            PermissionResource.SYSTEM_USER_BIND_ROLE
    })
    @GetMapping("/list")
    public PageResponse<RoleListItemVo> list(@Valid RoleListRequest request) {
        return roleService.getList(request);
    }

    /**
     * 新增角色。
     *
     * 第一版只维护角色基础资料与状态，不涉及权限分配。
     *
     * @param request 新增请求
     * @return 角色信息
     */
    @Operation(summary = "新增角色")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_CREATE)
    @PostMapping("/add")
    public RoleListItemVo add(@Valid @RequestBody RoleAddRequest request) {
        return roleService.add(request);
    }

    /**
     * 编辑角色。
     *
     * 当前仅支持更新角色基础资料与状态，不涉及权限分配。
     *
     * @param id      角色 ID
     * @param request 编辑请求
     * @return 角色信息
     */
    @Operation(summary = "编辑角色")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_EDIT)
    @PostMapping("/update")
    public RoleListItemVo update(@Parameter(description = "角色 ID", required = true) @RequestParam @NotNull(message = "角色 ID 不能为空") Long id,
                                 @Valid @RequestBody RoleUpdateRequest request) {
        return roleService.update(id, request);
    }

    /**
     * 修改单个角色状态。
     *
     * 用于列表页中的单条启用/禁用操作。
     *
     * @param request 状态请求
     */
    @Operation(summary = "修改单个角色状态")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_CHANGE_STATUS)
    @PostMapping("/update_status")
    public void updateStatus(@Valid @RequestBody RoleUpdateStatusRequest request) {
        roleService.updateStatus(request);
    }

    /**
     * 批量修改角色状态。
     *
     * 当前仅支持批量启用/禁用，用于角色管理列表页的批量操作。
     *
     * @param request 批量状态请求
     */
    @Operation(summary = "批量修改角色状态")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_BATCH_CHANGE_STATUS)
    @PostMapping("/batch_update_status")
    public void batchUpdateStatus(@Valid @RequestBody RoleBatchUpdateStatusRequest request) {
        roleService.batchUpdateStatus(request);
    }

    /**
     * 查询角色权限配置。
     *
     * @param roleCode 角色编码
     * @return 角色权限信息
     */
    @Operation(summary = "查询角色权限配置")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_PERMISSION)
    @GetMapping("/permission")
    public RolePermissionVo getPermission(
            @Parameter(description = "角色编码", required = true) @RequestParam @NotBlank(message = "角色编码不能为空") String roleCode) {
        return permissionService.getRolePermission(roleCode);
    }

    /**
     * 更新角色权限配置。
     *
     * @param roleCode 角色编码
     * @param request  权限更新请求
     */
    @Operation(summary = "更新角色权限配置")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_PERMISSION)
    @PostMapping("/permission/update")
    public void updatePermission(
            @Parameter(description = "角色编码", required = true) @RequestParam @NotBlank(message = "角色编码不能为空") String roleCode,
            @Valid @RequestBody RolePermissionUpdateRequest request) {
        permissionService.updateRoleMenuPermissions(roleCode, request.getMenus());
    }

    /**
     * 获取角色已绑定的用户 ID 列表。
     *
     * @param roleCode 角色编码
     * @return 用户 ID 列表
     */
    @Operation(summary = "获取角色已绑定用户")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_BIND_USER)
    @GetMapping("/users")
    public List<Long> getRoleUsers(
            @Parameter(description = "角色编码", required = true) @RequestParam @NotBlank(message = "角色编码不能为空") String roleCode) {
        roleService.requireRoleByCode(roleCode);
        return permissionService.getRoleUsers(roleCode);
    }

    /**
     * 更新角色绑定用户。
     *
     * 先解绑所有用户，再重新绑定传入的用户列表；传空列表则清空所有绑定。
     *
     * @param roleCode 角色编码
     * @param request  用户 ID 列表
     */
    @Operation(summary = "更新角色绑定用户")
    @RequirePermission(PermissionResource.SYSTEM_ROLE_BIND_USER)
    @PostMapping("/users/update")
    public void updateRoleUsers(
            @Parameter(description = "角色编码", required = true) @RequestParam @NotBlank(message = "角色编码不能为空") String roleCode,
            @Valid @RequestBody RoleUserUpdateRequest request) {
        roleService.requireRoleByCode(roleCode);
        permissionService.updateRoleUsers(roleCode, request.getUserIds());
    }
}
