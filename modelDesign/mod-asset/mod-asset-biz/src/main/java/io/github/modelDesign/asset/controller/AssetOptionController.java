package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.response.AssetOptionVo;
import io.github.modelDesign.asset.service.AssetOptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 资产下拉选项控制器。
 */
@Tag(name = "资产下拉选项")
@RestController
@RequestMapping("/asset/options")
@RequiredArgsConstructor
public class AssetOptionController {
    /**
     * 下拉服务。
     */
    private final AssetOptionService assetOptionService;

    /**
     * 获取用户下拉。
     *
     * @return 用户下拉
     */
    @Operation(summary = "获取用户下拉")
    @GetMapping("/users")
    public List<AssetOptionVo> users() {
        return assetOptionService.getUserOptions();
    }

    /**
     * 获取位置下拉。
     *
     * @return 位置下拉
     */
    @Operation(summary = "获取位置下拉")
    @GetMapping("/locations")
    public List<AssetOptionVo> locations() {
        return assetOptionService.getLocationOptions();
    }

    /**
     * 获取分类下拉。
     *
     * @return 分类下拉
     */
    @Operation(summary = "获取分类下拉")
    @GetMapping("/categories")
    public List<AssetOptionVo> categories() {
        return assetOptionService.getCategoryOptions();
    }
}
