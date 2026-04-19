package io.github.modelDesign.controller;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.response.McpConfigVo;
import io.github.modelDesign.service.McpConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * MCP 配置接口。
 */
@Tag(name = "MCP 配置")
@RestController
@RequiredArgsConstructor
@RequestMapping("/ai/mcp/config")
public class McpConfigController {
    /**
     * MCP 配置服务。
     */
    private final McpConfigService mcpConfigService;

    /**
     * 获取当前可展示的 MCP 配置。
     *
     * @return MCP 配置
     */
    @Operation(summary = "获取当前 MCP 配置")
    @GetMapping("/current")
    @IgnorePermission
    public McpConfigVo current() {
        return mcpConfigService.getCurrentConfig();
    }
}
