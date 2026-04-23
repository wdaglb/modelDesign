package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.request.AssetDeviceListRequest;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.asset.response.PageResponse;
import io.github.modelDesign.asset.service.AssetDeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 设备台账控制器。
 */
@Tag(name = "设备台账")
@RestController
@RequestMapping("/asset/device")
@RequiredArgsConstructor
@Validated
public class AssetDeviceController {
    /**
     * 设备台账服务。
     */
    private final AssetDeviceService assetDeviceService;

    /**
     * 分页查询设备台账。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "分页查询设备台账")
    @GetMapping("/list")
    public PageResponse<AssetDeviceVo> list(@Valid AssetDeviceListRequest request) {
        return assetDeviceService.getList(request);
    }

    /**
     * 入库登记。
     *
     * @param request 入库请求
     * @return 台账详情
     */
    @Operation(summary = "入库登记")
    @PostMapping("/create")
    public AssetDeviceVo create(@Valid @RequestBody AssetDeviceCreateRequest request) {
        return assetDeviceService.create(request);
    }
}
