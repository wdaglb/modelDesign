package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;

/**
 * 资产流水写入服务。
 *
 * 当前阶段先提供稳定入口，
 * 具体的流水实体写入在后续状态机任务中补齐。
 */
@Service
public class AssetTransactionWriteService {
    /**
     * 记录入库流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeInbound(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 记录领用流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeReceive(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 记录归还流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeReturn(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 记录调拨流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeTransfer(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 记录报废流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeScrap(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 记录盘点盘亏流水。
     *
     * @param assetDevice     设备实体
     * @param operatorUserId  操作人 ID
     * @param remark          备注
     */
    public void writeStocktakeLoss(AssetDevice assetDevice, Long operatorUserId, String remark) {
    }

    /**
     * 统一整理动作备注，避免后续真实写库时出现 null 文本分支。
     *
     * @param remark 原始备注
     * @return 规范化后的备注
     */
    protected String normalizeRemark(String remark) {
        if (!StringUtils.hasText(remark)) {
            return "";
        }
        return remark.trim();
    }
}
