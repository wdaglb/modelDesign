package io.github.modelDesign.thirdparty.oauth.enums;

/**
 * OAuth 绑定短会话状态。
 */
public enum OauthBindingSessionStatus {
    PENDING,
    AUTHORIZING,
    BINDING,
    SUCCESS,
    FAILED,
    EXPIRED,
    CANCELLED
}
