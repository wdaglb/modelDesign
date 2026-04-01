package io.github.modelDesign.system.enums;

import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;

/**
 * 系统消息读取状态。
 */
public enum SystemMessageReadStatusEnum {
    /**
     * 已读。
     */
    READ("read"),

    /**
     * 未读。
     */
    UNREAD("unread");

    /**
     * 状态值。
     */
    private final String value;

    SystemMessageReadStatusEnum(String value) {
        this.value = value;
    }

    /**
     * 获取状态值。
     *
     * @return 状态值
     */
    public String getValue() {
        return value;
    }

    /**
     * 按值解析读取状态。
     *
     * @param value 原始值
     * @return 读取状态，为空时返回 {@code null}
     */
    public static SystemMessageReadStatusEnum fromValue(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalizedValue = value.trim();
        for (SystemMessageReadStatusEnum item : values()) {
            if (item.getValue().equals(normalizedValue)) {
                return item;
            }
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "消息读取状态不合法");
    }
}
