package io.github.modelDesign.asset.enums;

import lombok.Getter;

/**
 * 盘点明细结果枚举。
 */
@Getter
public enum AssetStocktakeItemResultEnum {
    /**
     * 盘到。
     */
    FOUND(1, "盘到"),

    /**
     * 未找到。
     */
    MISSING(2, "未找到");

    /**
     * 数据库存储值。
     */
    private final Integer value;

    /**
     * 显示名称。
     */
    private final String label;

    AssetStocktakeItemResultEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }
}
