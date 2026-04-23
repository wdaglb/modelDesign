package io.github.modelDesign.asset.enums;

import lombok.Getter;

/**
 * 资产流水类型枚举。
 */
@Getter
public enum AssetTransactionTypeEnum {
    /**
     * 入库登记。
     */
    INBOUND(1, "入库登记"),

    /**
     * 领用。
     */
    RECEIVE(2, "领用"),

    /**
     * 归还。
     */
    RETURN(3, "归还"),

    /**
     * 调拨。
     */
    TRANSFER(4, "调拨"),

    /**
     * 报废。
     */
    SCRAP(5, "报废");

    /**
     * 数据库存储值。
     */
    private final Integer value;

    /**
     * 显示名称。
     */
    private final String label;

    AssetTransactionTypeEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }
}
