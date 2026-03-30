package io.github.modelDesign.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.client.RestClient;

@Configuration
@Slf4j
public class ChatConfiguration {
    @Bean
    @Lazy
    public RestClient restClient() {
        // 创建自定义的 RestClient 来打印 URL
        return RestClient.builder()
                .requestInterceptor((request, body, execution) -> {
                    log.info("Request: {} {}", request.getMethod(), request.getURI());
                    log.info("Request Method: {}", request.getMethod());
                    log.info("Full URL: {}", request.getURI());
                    log.info("Headers: {}", request.getHeaders());
                    if (body.length > 0) {
                        log.info("Request Body: {}", new String(body));
                    }
                    log.info("==================================\n");

                    // 执行请求
                    return execution.execute(request, body);
                })
                .build();

    }
}
