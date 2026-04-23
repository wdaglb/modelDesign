package io.github.modelDesign.asset.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 设备台账实体。
 *
 * 当前实体只保存设备最新状态，
 * 历史流转记录统一下沉到资产流水表中管理。
 */
@Data
@TableName("assetDevice")
@EqualsAndHashCode(callSuper = true)
public class AssetDevice extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 设备名称。
     */
    private String deviceName;

    /**
     * 设备分类 ID。
     */
    private Long categoryId;

    /**
     * 资产编号。
     */
    private String assetCode;

    /**
     * 序列号。
     */
    private String serialNumber;

    /**
     * 当前状态值。
     */
    private Integer status;

    /**
     * 当前存放位置 ID。
     */
    private Long locationId;

    /**
     * 当前使用人 ID。
     */
    private Long currentUserId;

    /**
     * 购置日期。
     */
    private LocalDate purchaseDate;

    /**
     * 备注。
     */
    private String remark;

    /**
     * 最近一次业务操作时间。
     */
    private LocalDateTime lastOperatedAt;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
