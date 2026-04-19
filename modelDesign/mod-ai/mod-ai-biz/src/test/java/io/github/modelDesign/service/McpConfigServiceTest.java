package io.github.modelDesign.service;

import io.github.modelDesign.configuration.McpDisplayProperties;
import io.github.modelDesign.response.McpConfigVo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * MCP 配置展示服务测试。
 */
class McpConfigServiceTest {
    /**
     * 当前配置查询应按展示属性原样映射。
     */
    @Test
    void getCurrentConfigShouldMapDisplayProperties() {
        McpDisplayProperties properties = new McpDisplayProperties();
        properties.setEnabled(true);
        properties.setServerName("task-mcp");
        properties.setTransportType("streamable-http");
        properties.setEndpoint("http://127.0.0.1:9999/ai/mcp");
        properties.setDescription("供个人中心展示的 MCP 配置");

        McpConfigService service = new McpConfigService(properties);

        McpConfigVo result = service.getCurrentConfig();

        assertTrue(result.getEnabled());
        assertEquals("task-mcp", result.getServerName());
        assertEquals("streamable-http", result.getTransportType());
        assertEquals("http://127.0.0.1:9999/ai/mcp", result.getEndpoint());
        assertEquals("供个人中心展示的 MCP 配置", result.getDescription());
    }
}
