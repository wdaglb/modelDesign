package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.MenuCreateRequest;
import io.github.modelDesign.auth.request.MenuDeleteRequest;
import io.github.modelDesign.auth.request.MenuEditRequest;
import io.github.modelDesign.auth.request.MenuSwapSortRequest;
import io.github.modelDesign.auth.response.MenuVo;
import io.github.modelDesign.auth.service.MenuService;
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
    @PostMapping("/edit")
    public MenuVo edit(@RequestParam @NotNull(message = "菜单 ID 不能为空") Long id,
                       @Valid @RequestBody MenuEditRequest request) {
        return menuService.edit(id, request);
    }

    /**
     * 删除菜单。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @PostMapping("/delete")
    public Integer delete(@Valid @RequestBody MenuDeleteRequest request) {
        return menuService.delete(request.getIds());
    }

    /**
     * 交换菜单排序。
     *
     * @param request 排序请求
     */
    @PostMapping("/swap_sort")
    public void swapSort(@Valid @RequestBody MenuSwapSortRequest request) {
        menuService.swapSort(request.getSource(), request.getTarget());
    }
}
