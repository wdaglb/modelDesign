package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import io.github.modelDesign.asset.enums.AssetStocktakeItemResultEnum;
import io.github.modelDesign.asset.request.AssetStocktakeCheckRequest;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * 盘点数量核验辅助类。
 *
 * 盘点任务服务已承担任务状态和明细流转职责，数量默认值和一致性校验下沉到
 * 独立辅助类，避免服务类继续堆积数量口径细节。
 */
final class AssetStocktakeQuantityHelper {
    private AssetStocktakeQuantityHelper() {
    }

    /**
     * 解析实际数量。
     *
     * @param request      盘点请求
     * @param item         盘点明细
     * @param resultStatus 盘点结果
     * @return 实际数量
     */
    static Integer resolveActualQuantity(AssetStocktakeCheckRequest request,
                                         AssetStocktakeItem item,
                                         AssetStocktakeItemResultEnum resultStatus) {
        if (request.getActualQuantity() != null) {
            return request.getActualQuantity();
        }
        if (resultStatus == AssetStocktakeItemResultEnum.MISSING) {
            return 0;
        }
        return resolveExpectedQuantity(item);
    }

    /**
     * 解析账面数量。
     *
     * @param item 盘点明细
     * @return 账面数量；历史数据为空时按逐台设备模型默认 1
     */
    static Integer resolveExpectedQuantity(AssetStocktakeItem item) {
        if (item.getExpectedQuantity() == null) {
            return 1;
        }
        return item.getExpectedQuantity();
    }

    /**
     * 校验盘点结果和实际数量是否一致。
     *
     * @param resultStatus   盘点结果
     * @param actualQuantity 实际数量
     */
    static void validateResultQuantity(AssetStocktakeItemResultEnum resultStatus,
                                       Integer actualQuantity) {
        if (resultStatus == AssetStocktakeItemResultEnum.FOUND && actualQuantity <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘到设备的实际数量必须大于 0");
        }
        if (resultStatus == AssetStocktakeItemResultEnum.MISSING && actualQuantity > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "未找到设备的实际数量必须为 0");
        }
    }
}
