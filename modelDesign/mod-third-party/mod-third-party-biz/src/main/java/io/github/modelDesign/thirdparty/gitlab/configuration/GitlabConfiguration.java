package io.github.modelDesign.thirdparty.gitlab.configuration;

import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * GitLab 集成模块配置。
 */
@Configuration
@EnableConfigurationProperties(GitlabProperties.class)
public class GitlabConfiguration {
    /**
     * GitLab 专用 HTTP 客户端。
     *
     * <p>GitLab 自建实例网络质量差异较大，因此单独声明客户端，避免影响
     * 企业微信等其它第三方 provider 的超时策略。</p>
     *
     * @param gitlabProperties GitLab 模块配置
     * @return OkHttpClient 实例
     */
    @Bean
    public OkHttpClient gitlabOkHttpClient(GitlabProperties gitlabProperties) {
        return new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(gitlabProperties.getConnectTimeoutSeconds()))
                .readTimeout(Duration.ofSeconds(gitlabProperties.getReadTimeoutSeconds()))
                .writeTimeout(Duration.ofSeconds(gitlabProperties.getReadTimeoutSeconds()))
                .build();
    }
}
