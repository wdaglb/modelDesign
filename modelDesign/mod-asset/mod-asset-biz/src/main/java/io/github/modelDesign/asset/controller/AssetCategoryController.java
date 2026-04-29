package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetCategoryCreateRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteCheckRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteRequest;
import io.github.modelDesign.asset.request.AssetCategoryEditRequest;
import io.github.modelDesign.asset.response.AssetCategoryDeleteCheckVo;
import io.github.modelDesign.asset.response.AssetCategoryVo;
import io.github.modelDesign.asset.service.AssetCategoryService;
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
 * 设备分类控制器。
 */
@Tag(name = "设备分类")
@RestController
@RequestMapping("/asset/category")
@RequiredArgsConstructor
@Validated
public class AssetCategoryController {
    /**
     * 分类服务。
     */
    private final AssetCategoryService assetCategoryService;

    /**
     * 获取分类列表。
     *
     * @return 分类列表
     */
    @Operation(summary = "获取分类列表")
    @GetMapping("/list")
    public List<AssetCategoryVo> list() {
        return assetCategoryService.getList();
    }

    /**
     * 新建设备分类。
     *
     * @param request 创建请求
     * @return 分类详情
     */
    @Operation(summary = "新建设备分类")
    @PostMapping("/create")
    public AssetCategoryVo create(@Valid @RequestBody AssetCategoryCreateRequest request) {
        return assetCategoryService.create(request);
    }

    /**
     * 编辑设备分类。
     *
     * @param id      分类 ID
     * @param request 编辑请求
     * @return 分类详情
     */
    @Operation(summary = "编辑设备分类")
    @PostMapping("/edit")
    public AssetCategoryVo edit(
            @Parameter(description = "分类 ID", required = true)
            @RequestParam
            @NotNull(message = "分类 ID 不能为空")
            Long id,
            @Valid @RequestBody AssetCategoryEditRequest request) {
        return assetCategoryService.edit(id, request);
    }

    /**
     * 检查删除设备分类前的引用情况。
     *
     * @param request 删除前检查请求
     * @return 删除前检查结果
     */
    @Operation(summary = "检查删除设备分类前的引用情况")
    @PostMapping("/delete-check")
    public AssetCategoryDeleteCheckVo deleteCheck(
            @Valid @RequestBody AssetCategoryDeleteCheckRequest request) {
        return assetCategoryService.checkDelete(request);
    }

    /**
     * 删除设备分类。
     *
     * @param request 删除请求
     */
    @Operation(summary = "删除设备分类")
    @PostMapping("/delete")
    public void delete(@Valid @RequestBody AssetCategoryDeleteRequest request) {
        assetCategoryService.deleteCategories(request);
    }
}
