package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 资产流水实体。
 *
 * 这里保留设备前后状态、位置和使用人快照，
 * 便于后续追溯每一次生命周期动作。
 */
@Data
@TableName("assetTransaction")
@EqualsAndHashCode(callSuper = true)
public class AssetTransaction extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 设备 ID。
     */
    private Long deviceId;

    /**
     * 流水类型。
     */
    private Integer transactionType;

    /**
     * 变更前状态。
     */
    private Integer beforeStatus;

    /**
     * 变更后状态。
     */
    private Integer afterStatus;

    /**
     * 变更前位置 ID。
     */
    private Long beforeLocationId;

    /**
     * 变更后位置 ID。
     */
    private Long afterLocationId;

    /**
     * 变更前使用人 ID。
     */
    private Long beforeUserId;

    /**
     * 变更后使用人 ID。
     */
    private Long afterUserId;

    /**
     * 操作人 ID。
     */
    private Long operatorUserId;

    /**
     * 业务发生时间。
     */
    private LocalDateTime occurredAt;

    /**
     * 备注。
     */
    private String remark;
}
