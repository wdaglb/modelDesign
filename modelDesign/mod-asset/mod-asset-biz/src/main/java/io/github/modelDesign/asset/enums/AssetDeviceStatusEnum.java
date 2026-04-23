package io.github.modelDesign.asset.enums;

import lombok.Getter;

/**
 * 设备状态枚举。
 *
 * 第一版只保留最小必要状态，
 * 避免在未引入审批流前把流程中间态做复杂。
 */
@Getter
public enum AssetDeviceStatusEnum {
    /**
     * 在库。
     */
    IN_STOCK(1, "在库"),

    /**
     * 领用中。
     */
    IN_USE(2, "领用中"),

    /**
     * 丢失。
     */
    LOST(3, "盘亏"),

    /**
     * 已报废。
     */
    SCRAPPED(4, "已报废");

    /**
     * 数据库存储值。
     */
    private final Integer value;

    /**
     * 显示名称。
     */
    private final String label;

    AssetDeviceStatusEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }
}
