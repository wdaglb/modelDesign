package io.github.modelDesign.auth.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "model-design.auth")
public class AuthProperties {
    /**
     * JWT 签名密钥，长度需满足 HS256。
     */
    private String jwtSecret = "change-this-jwt-secret-change-this-jwt-secret";

    /**
     * access token 有效期，单位秒。
     */
    private long accessTokenExpireSeconds = 7200;

    /**
     * refresh token 有效期，单位秒。
     *
     * Note: 该值承载“长期登录”能力，默认按 30 天配置。
     */
    private long refreshTokenExpireSeconds = 30L * 24 * 60 * 60;

    /**
     * session 前缀。
     */
    private String sessionKeyPrefix = "auth:admin:token:";

    /**
     * 登录审计保留天数。
     */
    private int loginAuditRetentionDays = 90;

    /**
     * 登录审计定时清理 cron。
     */
    private String loginAuditCleanupCron = "0 30 3 * * *";
}
