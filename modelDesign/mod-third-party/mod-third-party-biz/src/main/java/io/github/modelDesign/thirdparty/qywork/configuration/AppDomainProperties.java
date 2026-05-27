package io.github.modelDesign.thirdparty.qywork.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 应用对外访问域名配置。
 */
@Data
@ConfigurationProperties(prefix = "app")
public class AppDomainProperties {
    /**
     * 后端对外公开域名。
     */
    private String domain;
}
