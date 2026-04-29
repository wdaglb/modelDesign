package io.github.modelDesign.asset.enums;

import lombok.Getter;

import java.util.Arrays;

/**
 * 盘点范围类型枚举。
 *
 * 盘点任务创建时会固化设备明细，范围类型只决定固化哪些设备，
 * 后续提交结果和完成任务都基于这批明细推进，避免任务执行中范围漂移。
 */
@Getter
public enum AssetStocktakeScopeTypeEnum {
    /**
     * 全部未删除且未报废设备。
     */
    ALL(1, "全部设备"),

    /**
     * 指定存放位置下未删除且未报废设备。
     */
    LOCATION(2, "指定位置");

    /**
     * 数据库存储值。
     */
    private final Integer value;

    /**
     * 显示名称。
     */
    private final String label;

    AssetStocktakeScopeTypeEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    /**
     * 按数据库值解析范围类型。
     *
     * @param value 数据库存储值
     * @return 范围类型；未匹配时返回 null，由业务层输出明确错误
     */
    public static AssetStocktakeScopeTypeEnum of(Integer value) {
        return Arrays.stream(values())
                .filter(item -> item.getValue().equals(value))
                .findFirst()
                .orElse(null);
    }
}
