package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
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
}
