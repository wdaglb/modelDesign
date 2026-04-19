package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * MCP token 视图对象。
 */
@Data
@Builder
@Schema(description = "MCP token")
public class McpTokenVo {
    /**
     * MCP token。
     */
    @Schema(description = "MCP token")
    private String token;

    /**
     * Authorization 头示例。
     */
    @Schema(description = "Authorization 头示例")
    private String authorizationHeader;

    /**
     * 过期时间戳，单位毫秒。
     */
    @Schema(description = "过期时间戳，单位毫秒")
    private Long expireTime;
}
