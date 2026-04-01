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
}
