package io.github.modelDesign.thirdparty.gitlab.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * GitLab 第三方集成配置。
 */
@Data
@ConfigurationProperties(prefix = "model-design.gitlab")
public class GitlabProperties {
    /**
     * GitLab Token 加密主密钥。
     *
     * <p>生产环境应通过外部配置覆盖该值。默认值只用于本地开发和测试，避免
     * 新增配置后应用无法启动；加密服务仍会校验密钥长度。</p>
     */
    private String tokenSecretKey = "change-this-gitlab-token-secret-32";

    /**
     * GitLab HTTP 连接超时时间，单位秒。
     */
    private long connectTimeoutSeconds = 10L;

    /**
     * GitLab HTTP 读取超时时间，单位秒。
     */
    private long readTimeoutSeconds = 15L;
}
