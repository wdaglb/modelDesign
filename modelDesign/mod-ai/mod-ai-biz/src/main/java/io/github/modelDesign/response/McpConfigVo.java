package io.github.modelDesign.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * MCP 配置展示视图。
 */
@Data
@Builder
@Schema(description = "MCP 配置展示信息")
public class McpConfigVo {
    /**
     * 是否启用。
     */
    @Schema(description = "是否启用")
    private Boolean enabled;

    /**
     * 服务名。
     */
    @Schema(description = "服务名")
    private String serverName;

    /**
     * 传输协议类型。
     */
    @Schema(description = "传输协议类型")
    private String transportType;

    /**
     * 服务地址。
     */
    @Schema(description = "服务地址")
    private String endpoint;

    /**
     * 配置说明。
     */
    @Schema(description = "配置说明")
    private String description;
}
