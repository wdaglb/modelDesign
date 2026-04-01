package io.github.modelDesign.thirdparty.qywork.configuration;

import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * 企业微信模块配置。
 */
@Configuration
@EnableConfigurationProperties(QyworkProperties.class)
public class QyworkConfiguration {
    /**
     * 企业微信专用 HTTP 客户端。
     *
     * @return OkHttpClient
     */
    @Bean
    public OkHttpClient qyworkOkHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(10))
                .writeTimeout(Duration.ofSeconds(10))
                .build();
    }
}
