package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import lombok.Builder;
import lombok.Value;

/**
 * 登录审计写入命令。
 */
@Value
@Builder
public class LoginAuditWriteCommand {
    /**
     * 用户 ID，失败场景可为空。
     */
    Long userId;

    /**
     * 租户 ID，失败场景可为空。
     */
    Long tenantId;

    /**
     * 登录流水号，失败场景可为空。
     */
    String loginId;

    /**
     * 登录 IP。
     */
    String loginIp;

    /**
     * 登录方式。
     */
    String loginType;

    /**
     * 登录状态。
     */
    LoginAuditStatusEnum loginStatus;

    /**
     * 用户名。
     */
    String username;

    /**
     * 请求 User-Agent 原文。
     */
    String userAgent;

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
     * 设备类型。
     */
    LoginDeviceTypeEnum deviceType;

    /**
     * 登录失败原因码。
     */
    LoginFailureReasonEnum failureReasonCode;

    /**
     * 登录失败原因文案。
     */
    String failureReasonText;
}
