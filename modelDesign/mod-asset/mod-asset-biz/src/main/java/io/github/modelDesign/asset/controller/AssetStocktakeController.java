package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetStocktakeCheckRequest;
import io.github.modelDesign.asset.request.AssetStocktakeCreateRequest;
import io.github.modelDesign.asset.response.AssetStocktakeDetailVo;
import io.github.modelDesign.asset.response.AssetStocktakeTaskVo;
import io.github.modelDesign.asset.service.AssetStocktakeService;
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
 * 盘点任务控制器。
 */
@Tag(name = "盘点任务")
@RestController
@RequestMapping("/asset/stocktake")
@RequiredArgsConstructor
@Validated
public class AssetStocktakeController {
    /**
     * 盘点任务服务。
     */
    private final AssetStocktakeService assetStocktakeService;

    /**
     * 获取任务列表。
     *
     * @return 任务列表
     */
    @Operation(summary = "获取盘点任务列表")
    @GetMapping("/list")
    public List<AssetStocktakeTaskVo> list() {
        return assetStocktakeService.getList();
    }

    /**
     * 创建盘点任务。
     *
     * @param request 创建请求
     * @return 任务详情
     */
    @Operation(summary = "创建盘点任务")
    @PostMapping("/create")
    public AssetStocktakeTaskVo create(@Valid @RequestBody AssetStocktakeCreateRequest request) {
        return assetStocktakeService.create(request);
    }

    /**
     * 提交盘点结果。
     *
     * @param request 盘点请求
     * @return 盘点详情
     */
    @Operation(summary = "提交盘点结果")
    @PostMapping("/check")
    public AssetStocktakeDetailVo check(@Valid @RequestBody AssetStocktakeCheckRequest request) {
        return assetStocktakeService.check(request);
    }

    /**
     * 完成盘点任务。
     *
     * @param id 任务 ID
     * @return 任务详情
     */
    @Operation(summary = "完成盘点任务")
    @PostMapping("/complete")
    public AssetStocktakeTaskVo complete(
            @Parameter(description = "任务 ID", required = true)
            @RequestParam
            @NotNull(message = "任务 ID 不能为空")
            Long id) {
        return assetStocktakeService.complete(id);
    }
}
