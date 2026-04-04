package io.github.modelDesign.auth.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

/**
 * 登录失败原因枚举。
 */
@Getter
public enum LoginFailureReasonEnum {
    /**
     * 用户不存在。
     */
    USER_NOT_FOUND("USER_NOT_FOUND", "用户不存在"),
    /**
     * 密码不匹配。
     */
    PASSWORD_MISMATCH("PASSWORD_MISMATCH", "密码不匹配"),
    /**
     * 用户已禁用。
     */
    USER_DISABLED("USER_DISABLED", "用户已禁用"),
    /**
     * 用户未绑定租户。
     */
    USER_TENANT_MISSING("USER_TENANT_MISSING", "用户未绑定租户"),
    /**
     * 租户已禁用。
     */
    TENANT_DISABLED("TENANT_DISABLED", "租户已禁用"),
    /**
     * 系统异常。
     */
    SYSTEM_ERROR("SYSTEM_ERROR", "系统异常");

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

    LoginFailureReasonEnum(String value, String label) {
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
    public static LoginFailureReasonEnum fromValue(String value) {
        return Arrays.stream(values())
                .filter(item -> item.value.equals(value))
                .findFirst()
                .orElse(SYSTEM_ERROR);
    }
}
