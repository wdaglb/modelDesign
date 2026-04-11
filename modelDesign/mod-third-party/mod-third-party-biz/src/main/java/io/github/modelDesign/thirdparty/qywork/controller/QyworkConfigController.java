package io.github.modelDesign.thirdparty.qywork.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.thirdparty.qywork.request.QyworkConfigSaveRequest;
import io.github.modelDesign.thirdparty.qywork.response.QyworkConfigVo;
import io.github.modelDesign.thirdparty.qywork.service.QyworkCorpConfigService;
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
 * 企业微信配置接口。
 */
@Tag(name = "企业微信配置")
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/third-party/qywork/config")
public class QyworkConfigController {
    /**
     * 企业微信配置服务。
     */
    private final QyworkCorpConfigService qyworkCorpConfigService;

    /**
     * 读取当前租户的企业微信配置。
     *
     * @return 企业微信配置
     */
    @Operation(summary = "获取当前租户企业微信配置")
    @RequirePermission(PermissionResource.SYSTEM_QYWORK)
    @GetMapping("/current")
    public QyworkConfigVo current() {
        return qyworkCorpConfigService.getCurrentConfig();
    }

    /**
     * 保存当前租户的企业微信配置。
     *
     * @param request 保存请求
     * @return 保存后的企业微信配置
     */
    @Operation(summary = "保存当前租户企业微信配置")
    @RequirePermission(PermissionResource.SYSTEM_QYWORK_SAVE)
    @PostMapping("/save")
    public QyworkConfigVo save(@Valid @RequestBody QyworkConfigSaveRequest request) {
        return qyworkCorpConfigService.saveCurrentConfig(request);
    }
}
