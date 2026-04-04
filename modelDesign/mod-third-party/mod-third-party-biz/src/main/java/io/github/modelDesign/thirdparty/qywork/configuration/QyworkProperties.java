package io.github.modelDesign.thirdparty.qywork.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 企业微信配置。
 */
@Data
@ConfigurationProperties(prefix = "model-design.qywork")
public class QyworkProperties {
    /**
     * 企业微信基础地址。
     */
    private String baseUrl = "https://qyapi.weixin.qq.com";

    /**
     * access token 缓存键前缀。
     */
    private String accessTokenCacheKeyPrefix = "qywork:access-token:";

    /**
     * access token 提前刷新秒数。
     */
    private long accessTokenRefreshAdvanceSeconds = 300L;

    /**
     * OAuth 绑定会话 key 前缀。
     */
    private String bindingSessionKeyPrefix = "oauth:binding:session:";

    /**
     * OAuth 绑定二维码 scene key 前缀。
     */
    private String bindingSceneKeyPrefix = "oauth:binding:scene:";

    /**
     * OAuth 绑定会话有效期秒数。
     */
    private long bindingSessionExpireSeconds = 300L;

    /**
     * OAuth 绑定结果保留秒数。
     */
    private long bindingResultRetainSeconds = 180L;

    /**
     * 企业微信 OAuth 授权地址。
     */
    private String oauthAuthorizeUrl = "https://open.weixin.qq.com/connect/oauth2/authorize";

    /**
     * 企业微信 OAuth scope。
     */
    private String oauthScope = "snsapi_base";
}
