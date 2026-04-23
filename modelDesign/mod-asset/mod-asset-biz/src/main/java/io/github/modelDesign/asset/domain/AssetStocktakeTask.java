package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 盘点任务实体。
 */
@Data
@TableName("assetStocktakeTask")
@EqualsAndHashCode(callSuper = true)
public class AssetStocktakeTask extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 任务名称。
     */
    private String name;

    /**
     * 盘点范围类型。
     */
    private Integer scopeType;

    /**
     * 盘点范围位置 ID。
     */
    private Long scopeLocationId;

    /**
     * 任务状态。
     */
    private Integer status;

    /**
     * 开始时间。
     */
    private LocalDateTime startedAt;

    /**
     * 完成时间。
     */
    private LocalDateTime finishedAt;

    /**
     * 备注。
     */
    private String remark;

    /**
     * 创建人 ID。
     */
    private Long createdUserId;
}
