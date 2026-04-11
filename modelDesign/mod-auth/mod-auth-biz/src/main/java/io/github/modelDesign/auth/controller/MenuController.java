package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.request.MenuCreateRequest;
import io.github.modelDesign.auth.request.MenuDeleteRequest;
import io.github.modelDesign.auth.request.MenuEditRequest;
import io.github.modelDesign.auth.request.MenuSwapSortRequest;
import io.github.modelDesign.auth.response.MenuVo;
import io.github.modelDesign.auth.service.MenuService;
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
 * 菜单管理接口。
 */
@Tag(name = "菜单管理")
@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
@Validated
public class MenuController {
    /**
     * 菜单服务。
     */
    private final MenuService menuService;

    /**
     * 获取菜单列表。
     *
     * @return 菜单列表
     */
    @Operation(summary = "获取菜单列表")
    @RequirePermission(anyOf = {
            PermissionResource.SYSTEM_MENU,
            PermissionResource.SYSTEM_ROLE_PERMISSION
    })
    @GetMapping("/list")
    public List<MenuVo> list() {
        return menuService.getList();
    }

    /**
     * 创建菜单。
     *
     * @param request 创建请求
     * @return 菜单信息
     */
    @Operation(summary = "创建菜单")
    @RequirePermission(PermissionResource.SYSTEM_MENU_CREATE)
    @PostMapping("/create")
    public MenuVo create(@Valid @RequestBody MenuCreateRequest request) {
        return menuService.create(request);
    }

    /**
     * 编辑菜单。
     *
     * @param id      菜单 ID
     * @param request 编辑请求
     * @return 菜单信息
     */
    @Operation(summary = "编辑菜单")
    @RequirePermission(PermissionResource.SYSTEM_MENU_EDIT)
    @PostMapping("/edit")
    public MenuVo edit(@Parameter(description = "菜单 ID", required = true) @RequestParam @NotNull(message = "菜单 ID 不能为空") Long id,
                       @Valid @RequestBody MenuEditRequest request) {
        return menuService.edit(id, request);
    }

    /**
     * 删除菜单。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Operation(summary = "删除菜单")
    @RequirePermission(PermissionResource.SYSTEM_MENU_DELETE)
    @PostMapping("/delete")
    public Integer delete(@Valid @RequestBody MenuDeleteRequest request) {
        return menuService.delete(request.getIds());
    }

    /**
     * 交换菜单排序。
     *
     * @param request 排序请求
     */
    @Operation(summary = "交换菜单排序")
    @RequirePermission(PermissionResource.SYSTEM_MENU_SORT)
    @PostMapping("/swap_sort")
    public void swapSort(@Valid @RequestBody MenuSwapSortRequest request) {
        menuService.swapSort(request.getSource(), request.getTarget());
    }
}
