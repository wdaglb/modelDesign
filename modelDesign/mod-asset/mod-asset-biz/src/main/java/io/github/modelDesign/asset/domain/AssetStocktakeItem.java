package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 盘点明细实体。
 */
@Data
@TableName("assetStocktakeItem")
@EqualsAndHashCode(callSuper = true)
public class AssetStocktakeItem extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 设备 ID。
     */
    private Long deviceId;

    /**
     * 盘点结果状态。
     */
    private Integer resultStatus;

    /**
     * 实际位置 ID。
     */
    private Long actualLocationId;

    /**
     * 实际使用人 ID。
     */
    private Long actualUserId;

    /**
     * 盘点人 ID。
     */
    private Long checkedUserId;

    /**
     * 盘点时间。
     */
    private LocalDateTime checkedAt;

    /**
     * 备注。
     */
    private String remark;
}
