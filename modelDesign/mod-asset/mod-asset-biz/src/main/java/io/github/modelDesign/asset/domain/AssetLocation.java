package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 设备位置实体。
 */
@Data
@TableName("assetLocation")
@EqualsAndHashCode(callSuper = true)
public class AssetLocation extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 位置名称。
     */
    private String name;

    /**
     * 位置编码。
     */
    private String code;

    /**
     * 父级位置 ID。
     */
    private Long parentId;

    /**
     * 负责人 ID。
     */
    private Long managerUserId;

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
