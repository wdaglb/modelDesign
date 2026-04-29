package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import io.github.modelDesign.asset.response.AssetStocktakeDetailVo;

import java.util.Objects;

/**
 * 盘点视图组装器。
 *
 * 盘点服务负责状态流转，视图对象字段映射集中到这里，避免服务类同时承担
 * 状态机、数量口径和响应组装三类职责。
 */
final class AssetStocktakeVoAssembler {
    private AssetStocktakeVoAssembler() {
    }

    /**
     * 组装盘点明细视图。
     *
     * @param item   盘点明细
     * @param device 当前设备台账；可能为空或租户不匹配
     * @return 盘点明细视图
     */
    static AssetStocktakeDetailVo toDetailVo(AssetStocktakeItem item, AssetDevice device) {
        AssetStocktakeDetailVo.AssetStocktakeDetailVoBuilder builder =
                AssetStocktakeDetailVo.builder()
                        .id(item.getId())
                        .taskId(item.getTaskId())
                        .deviceId(item.getDeviceId())
                        .expectedQuantity(AssetStocktakeQuantityHelper.resolveExpectedQuantity(item))
                        .actualQuantity(item.getActualQuantity())
                        .differenceQuantity(item.getDifferenceQuantity())
                        .resultStatus(item.getResultStatus())
                        .actualLocationId(item.getActualLocationId())
                        .actualUserId(item.getActualUserId())
                        .checkedUserId(item.getCheckedUserId())
                        .checkedAt(item.getCheckedAt())
                        .remark(item.getRemark());
        if (device != null && Objects.equals(device.getTenantId(), item.getTenantId())) {
            builder.deviceName(device.getDeviceName())
                    .assetCode(device.getAssetCode())
                    .deviceStatus(device.getStatus())
                    .expectedLocationId(device.getLocationId())
                    .expectedUserId(device.getCurrentUserId());
        }
        return builder.build();
    }
}
