package io.github.modelDesign.auth.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 权限资源目录服务测试。
 */
class PermissionResourceCatalogServiceTest {
    /**
     * 路径变量应统一转换为单层通配符。
     */
    @Test
    void shouldNormalizePathVariableToSingleLevelWildcard() {
        PermissionResourceCatalogService service = new PermissionResourceCatalogService(null);

        assertEquals(
                "/system/file/image/content/*",
                service.normalizeMappingPath("/system/file/image/content/{id}/")
        );
    }
}
