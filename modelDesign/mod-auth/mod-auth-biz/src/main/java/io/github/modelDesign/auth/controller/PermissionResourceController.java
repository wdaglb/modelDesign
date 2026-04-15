package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.response.PermissionResourceCatalogItemVo;
import io.github.modelDesign.auth.service.PermissionResourceCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 权限资源目录接口。
 */
@Tag(name = "权限资源目录")
@RestController
@RequestMapping("/permission-resource")
@RequiredArgsConstructor
@Validated
public class PermissionResourceController {
    /**
     * 权限资源目录服务。
     */
    private final PermissionResourceCatalogService permissionResourceCatalogService;

    /**
     * 获取接口资源目录。
     *
     * 该接口只服务角色授权与资源组授权页面，
     * 运行时鉴权统一交给路径权限匹配处理。
     *
     * @return 接口资源目录
     */
    @Operation(summary = "获取接口资源目录")
    @GetMapping("/catalog")
    public List<PermissionResourceCatalogItemVo> getCatalog() {
        return permissionResourceCatalogService.getApiCatalog();
    }
}
