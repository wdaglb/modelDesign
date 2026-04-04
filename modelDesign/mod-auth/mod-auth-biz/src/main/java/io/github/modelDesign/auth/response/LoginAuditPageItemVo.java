package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 登录审计分页项。
 */
@Data
@Builder
@Schema(description = "登录审计分页项")
public class LoginAuditPageItemVo {
    /**
     * 主键 ID。
     */
    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 用户 ID。
     */
    @Schema(description = "用户 ID")
    private Long userId;

    /**
     * 用户名。
     */
    @Schema(description = "用户名")
    private String username;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 登录流水号。
     */
    @Schema(description = "登录流水号")
    private String loginId;

    /**
     * 登录 IP。
     */
    @Schema(description = "登录 IP")
    private String loginIp;

    /**
     * 登录状态。
     */
    @Schema(description = "登录状态")
    private String loginStatus;

    /**
     * 登录方式。
     */
    @Schema(description = "登录方式")
    private String loginType;

    /**
     * 登录时间。
     */
    @Schema(description = "登录时间")
    private LocalDateTime loginTime;

    /**
     * 请求 User-Agent。
     */
    @Schema(description = "请求 User-Agent")
    private String userAgent;

    /**
     * 浏览器名称。
     */
    @Schema(description = "浏览器名称")
    private String browserName;

    /**
     * 浏览器版本。
     */
    @Schema(description = "浏览器版本")
    private String browserVersion;

    /**
     * 操作系统名称。
     */
    @Schema(description = "操作系统名称")
    private String osName;

    /**
     * 操作系统版本。
     */
    @Schema(description = "操作系统版本")
    private String osVersion;

    /**
     * 设备类型。
     */
    @Schema(description = "设备类型")
    private String deviceType;

    /**
     * 失败原因码。
     */
    @Schema(description = "失败原因码")
    private String failureReasonCode;

    /**
     * 失败原因文案。
     */
    @Schema(description = "失败原因文案")
    private String failureReasonText;
}
