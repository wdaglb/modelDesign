package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetLocationCreateRequest;
import io.github.modelDesign.asset.request.AssetLocationEditRequest;
import io.github.modelDesign.asset.response.AssetLocationVo;
import io.github.modelDesign.asset.service.AssetLocationService;
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
 * 设备位置控制器。
 */
@Tag(name = "设备位置")
@RestController
@RequestMapping("/asset/location")
@RequiredArgsConstructor
@Validated
public class AssetLocationController {
    /**
     * 位置服务。
     */
    private final AssetLocationService assetLocationService;

    /**
     * 获取位置列表。
     *
     * @return 位置列表
     */
    @Operation(summary = "获取位置列表")
    @GetMapping("/list")
    public List<AssetLocationVo> list() {
        return assetLocationService.getList();
    }

    /**
     * 新建设备位置。
     *
     * @param request 创建请求
     * @return 位置详情
     */
    @Operation(summary = "新建设备位置")
    @PostMapping("/create")
    public AssetLocationVo create(@Valid @RequestBody AssetLocationCreateRequest request) {
        return assetLocationService.create(request);
    }

    /**
     * 编辑设备位置。
     *
     * @param id      位置 ID
     * @param request 编辑请求
     * @return 位置详情
     */
    @Operation(summary = "编辑设备位置")
    @PostMapping("/edit")
    public AssetLocationVo edit(
            @Parameter(description = "位置 ID", required = true)
            @RequestParam
            @NotNull(message = "位置 ID 不能为空")
            Long id,
            @Valid @RequestBody AssetLocationEditRequest request) {
        return assetLocationService.edit(id, request);
    }
}
