package io.github.modelDesign.thirdparty.gitlab.configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * GitLab 集成模块配置。
 */
@Configuration
@EnableConfigurationProperties(GitlabProperties.class)
public class GitlabConfiguration {
}
