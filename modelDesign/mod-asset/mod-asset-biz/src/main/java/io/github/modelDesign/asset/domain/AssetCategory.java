package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 设备分类实体。
 */
@Data
@TableName("assetCategory")
@EqualsAndHashCode(callSuper = true)
public class AssetCategory extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 分类名称。
     */
    private String name;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 状态。
     */
    private Integer status;

    /**
     * 备注。
     */
    private String remark;
}
