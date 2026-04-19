package io.github.modelDesign.service;

import io.github.modelDesign.configuration.McpDisplayProperties;
import io.github.modelDesign.response.McpConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * MCP 配置展示服务。
 */
@Service
@RequiredArgsConstructor
public class McpConfigService {
    /**
     * MCP 展示配置。
     */
    private final McpDisplayProperties mcpDisplayProperties;

    /**
     * 获取当前可展示的 MCP 配置。
     *
     * @return MCP 配置视图
     */
    public McpConfigVo getCurrentConfig() {
        return McpConfigVo.builder()
                .enabled(mcpDisplayProperties.isEnabled())
                .serverName(mcpDisplayProperties.getServerName())
                .transportType(mcpDisplayProperties.getTransportType())
                .endpoint(mcpDisplayProperties.getEndpoint())
                .description(mcpDisplayProperties.getDescription())
                .build();
    }
}
