package io.github.modelDesign.configuration;

import io.github.modelDesign.tools.ProjectTaskTools;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.client.RestClient;

@Configuration
@Slf4j
@EnableConfigurationProperties(McpDisplayProperties.class)
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

    /**
     * 将任务工具对象注册为 MCP Server 可消费的 ToolCallbackProvider。
     *
     * 这里复用现有的 @Tool 方法定义，避免为 MCP Server 再维护一套重复工具实现。
     *
     * @param projectTaskTools 任务工具对象
     * @return MCP Server 工具回调提供器
     */
    @Bean
    @ConditionalOnBean(ProjectTaskTools.class)
    public ToolCallbackProvider projectTaskToolCallbackProvider(
            ProjectTaskTools projectTaskTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(projectTaskTools)
                .build();
    }
}
