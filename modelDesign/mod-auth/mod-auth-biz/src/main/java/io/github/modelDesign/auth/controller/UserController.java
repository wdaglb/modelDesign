package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.UserAddRequest;
import io.github.modelDesign.auth.request.UserBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.UserListRequest;
import io.github.modelDesign.auth.request.UserPositionUpdateRequest;
import io.github.modelDesign.auth.request.UserRoleUpdateRequest;
import io.github.modelDesign.auth.request.UserUpdateRequest;
import io.github.modelDesign.auth.request.UserUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.UserListItemVo;
import io.github.modelDesign.auth.service.PermissionService;
import io.github.modelDesign.auth.service.UserPositionService;
import io.github.modelDesign.auth.service.UserService;
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
 * 用户管理接口。
 *
 * 提供后台用户列表查询、添加、编辑以及状态切换能力。
 * 当前删除语义已经收敛为禁用/启用，因此这里不提供物理删除接口。
 */
@Tag(name = "用户管理")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Validated
public class UserController {
    /**
     * 用户服务。
     */
    private final UserService userService;

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 用户职位关系服务。
     */
    private final UserPositionService userPositionService;

    /**
     * 获取用户列表。
     *
     * 支持统一搜索、高级筛选与治理状态筛选，并返回分页结构给前端列表页使用。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取用户列表", description = "支持统一搜索、高级筛选与治理状态筛选")
    @GetMapping("/list")
    public PageResponse<UserListItemVo> list(@Valid UserListRequest request) {
        return userService.getList(request);
    }

    /**
     * 新增用户。
     *
     * 第一版由后台管理员直接创建用户，并设置初始密码与启用状态。
     *
     * @param request 新增请求
     * @return 用户信息
     */
    @Operation(summary = "新增用户")
    @PostMapping("/add")
    public UserListItemVo add(@Valid @RequestBody UserAddRequest request) {
        return userService.add(request);
    }

    /**
     * 编辑用户。
     *
     * 当密码为空时表示不修改原密码，仅更新基础资料和状态。
     *
     * @param id      用户 ID
     * @param request 编辑请求
     * @return 用户信息
     */
    @Operation(summary = "编辑用户")
    @PostMapping("/update")
    public UserListItemVo update(@Parameter(description = "用户 ID", required = true) @RequestParam @NotNull(message = "用户 ID 不能为空") Long id,
                                 @Valid @RequestBody UserUpdateRequest request) {
        return userService.update(id, request);
    }

    /**
     * 修改单个用户状态。
     *
     * 用于列表页中的单条启用/禁用操作。
     *
     * @param request 状态请求
     */
    @Operation(summary = "修改单个用户状态")
    @PostMapping("/update_status")
    public void updateStatus(@Valid @RequestBody UserUpdateStatusRequest request) {
        userService.updateStatus(request);
    }

    /**
     * 批量修改用户状态。
     *
     * 当前仅支持批量启用/禁用，用于用户管理列表页的批量操作。
     *
     * @param request 批量状态请求
     */
    @Operation(summary = "批量修改用户状态")
    @PostMapping("/batch_update_status")
    public void batchUpdateStatus(@Valid @RequestBody UserBatchUpdateStatusRequest request) {
        userService.batchUpdateStatus(request);
    }

    /**
     * 获取用户已绑定的角色编码列表。
     *
     * @param userId 用户 ID
     * @return 角色编码列表
     */
    @Operation(summary = "获取用户已绑定角色")
    @GetMapping("/roles")
    public List<String> getRoles(@Parameter(description = "用户 ID", required = true) @RequestParam @NotNull(message = "用户 ID 不能为空") Long userId) {
        userService.requireUser(userId);
        return permissionService.getUserRoles(String.valueOf(userId));
    }

    /**
     * 更新用户绑定角色。
     *
     * 先解绑所有角色，再重新绑定传入的角色列表；传空列表则清空所有绑定。
     *
     * @param userId  用户 ID
     * @param request 角色编码列表
     */
    @Operation(summary = "更新用户绑定角色")
    @PostMapping("/roles/update")
    public void updateRoles(@Parameter(description = "用户 ID", required = true) @RequestParam @NotNull(message = "用户 ID 不能为空") Long userId,
                            @Valid @RequestBody UserRoleUpdateRequest request) {
        userService.requireUser(userId);
        permissionService.updateUserRoles(String.valueOf(userId), request.getRoleCodes());
    }

    /**
     * 获取用户已绑定的职位 ID 列表。
     *
     * @param userId 用户 ID
     * @return 职位 ID 列表
     */
    @Operation(summary = "获取用户已绑定职位")
    @GetMapping("/positions")
    public List<Long> getPositions(
            @Parameter(description = "用户 ID", required = true)
            @RequestParam
            @NotNull(message = "用户 ID 不能为空")
            Long userId) {
        return userPositionService.getUserPositionIds(userId);
    }

    /**
     * 更新用户绑定职位。
     *
     * @param userId 用户 ID
     * @param request 职位 ID 列表
     */
    @Operation(summary = "更新用户绑定职位")
    @PostMapping("/positions/update")
    public void updatePositions(
            @Parameter(description = "用户 ID", required = true)
            @RequestParam
            @NotNull(message = "用户 ID 不能为空")
            Long userId,
            @Valid @RequestBody UserPositionUpdateRequest request) {
        userPositionService.updateUserPositions(userId, request);
    }
}
