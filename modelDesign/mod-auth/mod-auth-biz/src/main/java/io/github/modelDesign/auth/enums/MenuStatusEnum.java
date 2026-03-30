package io.github.modelDesign.auth.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

/**
 * 菜单状态枚举。
 */
@Getter
public enum MenuStatusEnum {
    /**
     * 禁用。
     */
    DISABLED(0, "禁用"),
    /**
     * 启用。
     */
    ENABLED(1, "启用");

    /**
     * 数据库存储值。
     */
    @EnumValue
    @JsonValue
    private final Integer value;

    /**
     * 枚举说明。
     */
    private final String label;

    MenuStatusEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    /**
     * 根据值解析枚举。
     *
     * @param value 枚举值
     * @return 枚举实例
     */
    @JsonCreator
    public static MenuStatusEnum fromValue(Integer value) {
        return Arrays.stream(values())
                .filter(item -> item.value.equals(value))
                .findFirst()
                .orElse(null);
    }
}
