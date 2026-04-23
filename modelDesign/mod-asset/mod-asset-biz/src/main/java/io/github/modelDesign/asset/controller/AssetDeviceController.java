package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.request.AssetDeviceEditRequest;
import io.github.modelDesign.asset.request.AssetDeviceListRequest;
import io.github.modelDesign.asset.request.AssetDeviceReceiveRequest;
import io.github.modelDesign.asset.request.AssetDeviceReturnRequest;
import io.github.modelDesign.asset.request.AssetDeviceScrapRequest;
import io.github.modelDesign.asset.request.AssetDeviceTransferRequest;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.asset.response.PageResponse;
import io.github.modelDesign.asset.service.AssetDeviceService;
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

    /**
     * 编辑设备台账。
     *
     * @param id      设备 ID
     * @param request 编辑请求
     * @return 台账详情
     */
    @Operation(summary = "编辑设备台账")
    @PostMapping("/edit")
    public AssetDeviceVo edit(
            @Parameter(description = "设备 ID", required = true)
            @RequestParam
            @NotNull(message = "设备 ID 不能为空")
            Long id,
            @Valid @RequestBody AssetDeviceEditRequest request) {
        return assetDeviceService.edit(id, request);
    }

    /**
     * 领用设备。
     *
     * @param request 领用请求
     * @return 台账详情
     */
    @Operation(summary = "领用设备")
    @PostMapping("/receive")
    public AssetDeviceVo receive(@Valid @RequestBody AssetDeviceReceiveRequest request) {
        return assetDeviceService.receive(request);
    }

    /**
     * 归还设备。
     *
     * @param request 归还请求
     * @return 台账详情
     */
    @Operation(summary = "归还设备")
    @PostMapping("/return")
    public AssetDeviceVo returned(@Valid @RequestBody AssetDeviceReturnRequest request) {
        return assetDeviceService.returned(request);
    }

    /**
     * 调拨设备。
     *
     * @param request 调拨请求
     * @return 台账详情
     */
    @Operation(summary = "调拨设备")
    @PostMapping("/transfer")
    public AssetDeviceVo transfer(@Valid @RequestBody AssetDeviceTransferRequest request) {
        return assetDeviceService.transfer(request);
    }

    /**
     * 报废设备。
     *
     * @param request 报废请求
     * @return 台账详情
     */
    @Operation(summary = "报废设备")
    @PostMapping("/scrap")
    public AssetDeviceVo scrap(@Valid @RequestBody AssetDeviceScrapRequest request) {
        return assetDeviceService.scrap(request);
    }
}
