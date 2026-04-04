package io.github.modelDesign.auth.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

/**
 * 登录设备类型枚举。
 */
@Getter
public enum LoginDeviceTypeEnum {
    /**
     * 桌面端。
     */
    DESKTOP("DESKTOP", "桌面端"),
    /**
     * 移动端。
     */
    MOBILE("MOBILE", "移动端"),
    /**
     * 平板端。
     */
    TABLET("TABLET", "平板端"),
    /**
     * 未知设备。
     */
    UNKNOWN("UNKNOWN", "未知设备");

    /**
     * 数据库存储值。
     */
    @EnumValue
    @JsonValue
    private final String value;

    /**
     * 枚举说明。
     */
    private final String label;

    LoginDeviceTypeEnum(String value, String label) {
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
    public static LoginDeviceTypeEnum fromValue(String value) {
        return Arrays.stream(values())
                .filter(item -> item.value.equals(value))
                .findFirst()
                .orElse(UNKNOWN);
    }
}
