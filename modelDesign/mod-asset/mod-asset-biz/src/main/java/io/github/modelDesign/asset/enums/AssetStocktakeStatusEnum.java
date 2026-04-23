package io.github.modelDesign.asset.enums;

import lombok.Getter;

/**
 * 盘点任务状态枚举。
 */
@Getter
public enum AssetStocktakeStatusEnum {
    /**
     * 进行中。
     */
    PROCESSING(1, "进行中"),

    /**
     * 已完成。
     */
    FINISHED(2, "已完成");

    /**
     * 数据库存储值。
     */
    private final Integer value;

    /**
     * 显示名称。
     */
    private final String label;

    AssetStocktakeStatusEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }
}
