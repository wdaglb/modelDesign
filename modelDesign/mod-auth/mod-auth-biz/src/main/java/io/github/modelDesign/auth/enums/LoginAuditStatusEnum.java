package io.github.modelDesign.auth.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

/**
 * 登录审计状态枚举。
 */
@Getter
public enum LoginAuditStatusEnum {
    /**
     * 登录成功。
     */
    SUCCESS("SUCCESS", "登录成功"),
    /**
     * 登录失败。
     */
    FAILURE("FAILURE", "登录失败");

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

    LoginAuditStatusEnum(String value, String label) {
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
    public static LoginAuditStatusEnum fromValue(String value) {
        return Arrays.stream(values())
                .filter(item -> item.value.equals(value))
                .findFirst()
                .orElse(FAILURE);
    }
}
