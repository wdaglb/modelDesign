package io.github.modelDesign.auth.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 权限资源校验器测试。
 */
class PermissionResourceValidatorTest {
    /**
     * 接口资源目录中的资源应允许保存。
     */
    @Test
    void shouldAcceptApiCatalogResource() {
        MenuService menuService = new MenuService() {
            @Override
            public Set<String> getAllNameSet() {
                return Set.of();
            }
        };
        PermissionResourceCatalogService permissionResourceCatalogService =
                new PermissionResourceCatalogService(null) {
                    @Override
                    public Set<String> getApiResourceNameSet() {
                        return Set.of("/permission-group/delete");
                    }
                };

        PermissionResourceValidator validator = new PermissionResourceValidator(
                menuService,
                permissionResourceCatalogService
        );

        assertEquals(
                List.of("/permission-group/delete"),
                validator.normalizeResourceNames(List.of("/permission-group/delete"), 2L)
        );
    }
}
