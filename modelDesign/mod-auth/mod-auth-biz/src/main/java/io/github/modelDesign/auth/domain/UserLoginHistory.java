package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户登录历史。
 */
@Data
@TableName("userLoginHistory")
@EqualsAndHashCode(callSuper = true)
public class UserLoginHistory extends BaseEntity {
    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 登录流水号。
     */
    private String loginId;

    /**
     * 登录 IP。
     */
    private String loginIp;

    /**
     * 登录方式。
     */
    private String loginType;

    /**
     * 登录状态。
     */
    private LoginAuditStatusEnum loginStatus;

    /**
     * 登录用户名。
     */
    private String username;

    /**
     * 登录请求 UA 原文。
     */
    private String userAgent;

    /**
     * 浏览器名称。
     */
    private String browserName;

    /**
     * 浏览器版本。
     */
    private String browserVersion;

    /**
     * 操作系统名称。
     */
    private String osName;

    /**
     * 操作系统版本。
     */
    private String osVersion;

    /**
     * 设备类型。
     */
    private LoginDeviceTypeEnum deviceType;

    /**
     * 失败原因码。
     */
    private LoginFailureReasonEnum failureReasonCode;

    /**
     * 失败原因文案。
     */
    private String failureReasonText;
}
