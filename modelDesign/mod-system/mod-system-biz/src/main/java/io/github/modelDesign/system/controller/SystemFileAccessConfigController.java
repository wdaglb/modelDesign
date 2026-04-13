package io.github.modelDesign.system.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.system.request.SystemFileAccessConfigSaveRequest;
import io.github.modelDesign.system.response.SystemFileAccessConfigVo;
import io.github.modelDesign.system.service.SystemFileAccessConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 文件访问配置接口。
 */
@Tag(name = "文件访问配置")
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/system/file/access-config")
public class SystemFileAccessConfigController {
    /**
     * 文件访问配置服务。
     */
    private final SystemFileAccessConfigService systemFileAccessConfigService;

    /**
     * 获取当前租户文件访问配置。
     *
     * @return 当前租户文件访问配置
     */
    @Operation(summary = "获取当前租户文件访问配置")
    @RequirePermission(PermissionResource.SYSTEM_FILE_CONFIG)
    @GetMapping("/current")
    public SystemFileAccessConfigVo current() {
        return systemFileAccessConfigService.getCurrentConfig();
    }

    /**
     * 保存当前租户文件访问配置。
     *
     * @param request 保存请求
     * @return 保存后的配置
     */
    @Operation(summary = "保存当前租户文件访问配置")
    @PostMapping("/save")
    public SystemFileAccessConfigVo save(
            @Valid @RequestBody SystemFileAccessConfigSaveRequest request) {
        return systemFileAccessConfigService.saveCurrentConfig(request);
    }
}
