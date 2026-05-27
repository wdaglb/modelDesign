package io.github.modelDesign.thirdparty.oauth.model;

import io.github.modelDesign.thirdparty.oauth.enums.OauthBindingSessionStatus;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 存入 Redis 的 OAuth 绑定短会话。
 */
@Data
@Builder
public class OauthBindingSession implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 会话 ID。
     */
    private String sessionId;

    /**
     * 当前租户 ID。
     */
    private Long tenantId;

    /**
     * 发起绑定的系统用户 ID。
     */
    private Long userId;

    /**
     * 第三方平台标识。
     */
    private String provider;

    /**
     * 第三方应用标识。
     */
    private String providerAppId;

    /**
     * 入口模式：企微内直绑或桌面二维码。
     */
    private String entryMode;

    /**
     * 后端配置的应用公开域名。
     */
    private String origin;

    /**
     * 二维码 token。
     */
    private String sceneToken;

    /**
     * OAuth state。
     */
    private String stateToken;

    /**
     * 当前会话状态。
     */
    private OauthBindingSessionStatus status;

    /**
     * 最近失败码。
     */
    private String failCode;

    /**
     * 最近失败信息。
     */
    private String failMessage;

    /**
     * 成功绑定后的第三方用户标识。
     */
    private String providerUserId;

    /**
     * 绑定完成时间。
     */
    private LocalDateTime completedAt;

    /**
     * 创建时间。
     */
    private LocalDateTime createdAt;

    /**
     * 过期时间。
     */
    private LocalDateTime expireAt;
}
