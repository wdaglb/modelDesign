package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import lombok.Builder;
import lombok.Value;

/**
 * 登录客户端信息模型。
 */
@Value
@Builder
public class LoginClientInfo {
    /**
     * 浏览器名称。
     */
    String browserName;

    /**
     * 浏览器版本。
     */
    String browserVersion;

    /**
     * 操作系统名称。
     */
    String osName;

    /**
     * 操作系统版本。
     */
    String osVersion;

    /**
     * 设备类型枚举值。
     */
    LoginDeviceTypeEnum deviceType;
}
