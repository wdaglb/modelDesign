package io.github.modelDesign.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 个人中心可见的 MCP 展示配置。
 *
 * 这里故意只保留前端需要展示的安全字段，
 * 不包含任何密钥、token 或其他敏感凭据。
 */
@Data
@ConfigurationProperties(prefix = "model-design.ai.mcp")
public class McpDisplayProperties {
    /**
     * 是否启用 MCP 配置展示。
     */
    private boolean enabled = false;

    /**
     * MCP 服务名。
     */
    private String serverName = "model-design-task-mcp";

    /**
     * 传输协议类型。
     */
    private String transportType = "streamable-http";

    /**
     * MCP 服务访问地址。
     */
    private String endpoint = "";

    /**
     * 配置说明。
     */
    private String description = "用于前端展示的 MCP 连接信息。";
}
