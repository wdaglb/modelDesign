package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.constant.PermissionType;
import io.github.modelDesign.auth.util.PermissionPathMatcher;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 权限资源校验器。
 *
 * 设计意图：
 * 1. 统一角色直绑资源和资源组资源的校验规则。
 * 2. 让通配符资源拥有明确的合法性约束，避免把无意义模式写入库中。
 * 3. 在保存阶段提前拦截租户越权授权，而不是等到运行期再兜底。
 */
@Component
public class PermissionResourceValidator {
    /**
     * 菜单服务。
     */
    private final MenuService menuService;

    /**
     * 接口资源目录服务。
     */
    private final PermissionResourceCatalogService permissionResourceCatalogService;

    public PermissionResourceValidator(MenuService menuService,
                                       PermissionResourceCatalogService permissionResourceCatalogService) {
        this.menuService = menuService;
        this.permissionResourceCatalogService = permissionResourceCatalogService;
    }

    /**
     * 校验并规范化资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @return 规范化后的资源列表
     */
    public List<String> normalizeResourceNames(List<String> resourceNames, Long tenantId) {
        return normalizeResourceNames(resourceNames, tenantId, null);
    }

    /**
     * 校验并规范化菜单资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @return 规范化后的菜单资源列表
     */
    public List<String> normalizeMenuResourceNames(List<String> resourceNames, Long tenantId) {
        return normalizeResourceNames(resourceNames, tenantId, PermissionType.MENU);
    }

    /**
     * 校验并规范化接口资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @return 规范化后的接口资源列表
     */
    public List<String> normalizeApiResourceNames(List<String> resourceNames, Long tenantId) {
        return normalizeResourceNames(resourceNames, tenantId, PermissionType.API);
    }

    /**
     * 按资源类型拆分资源集合。
     *
     * @param resourceNames 原始资源集合
     * @return 拆分结果
     */
    public PermissionResourceBuckets splitResourcesByType(Iterable<String> resourceNames) {
        LinkedHashSet<String> menuResources = new LinkedHashSet<>();
        LinkedHashSet<String> apiResources = new LinkedHashSet<>();
        if (resourceNames == null) {
            return new PermissionResourceBuckets(List.of(), List.of());
        }

        Set<String> existingMenuNames = menuService.getAllNameSet();
        Set<String> existingApiNames = permissionResourceCatalogService.getApiResourceNameSet();
        for (String resourceName : resourceNames) {
            if (!StringUtils.hasText(resourceName)) {
                continue;
            }
            String normalizedResourceName = normalizeResourceName(resourceName);
            String resourceType = resolveResourceType(
                    normalizedResourceName,
                    existingMenuNames,
                    existingApiNames
            );
            if (PermissionType.MENU.equals(resourceType)) {
                menuResources.add(normalizedResourceName);
                continue;
            }
            apiResources.add(normalizedResourceName);
        }
        return new PermissionResourceBuckets(
                new ArrayList<>(menuResources),
                new ArrayList<>(apiResources)
        );
    }

    /**
     * 判断资源是否属于指定类型。
     *
     * @param resourceName 资源名
     * @param expectedType 期望类型
     * @return 是否匹配
     */
    public boolean matchesResourceType(String resourceName, String expectedType) {
        if (!StringUtils.hasText(resourceName) || !StringUtils.hasText(expectedType)) {
            return false;
        }
        Set<String> existingMenuNames = menuService.getAllNameSet();
        Set<String> existingApiNames = permissionResourceCatalogService.getApiResourceNameSet();
        return expectedType.equals(
                resolveResourceType(
                        normalizeResourceName(resourceName),
                        existingMenuNames,
                        existingApiNames
                )
        );
    }

    /**
     * 校验并规范化资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @param expectedType 期望资源类型，可为空
     * @return 规范化后的资源列表
     */
    public List<String> normalizeResourceNames(List<String> resourceNames,
                                               Long tenantId,
                                               String expectedType) {
        if (resourceNames == null || resourceNames.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<String> normalizedNames = new LinkedHashSet<>();
        Set<String> existingMenuNames = menuService.getAllNameSet();
        Set<String> existingApiNames = permissionResourceCatalogService.getApiResourceNameSet();
        for (String resourceName : resourceNames) {
            if (!StringUtils.hasText(resourceName)) {
                continue;
            }
            String normalizedResourceName = normalizeResourceName(resourceName);
            if (!PermissionPathMatcher.isValidPattern(normalizedResourceName)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在非法的权限资源格式");
            }
            if (!PermissionResource.isResourceAssignable(tenantId, normalizedResourceName)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前租户不能分配平台级权限");
            }
            String resourceType = resolveResourceType(
                    normalizedResourceName,
                    existingMenuNames,
                    existingApiNames
            );
            if (StringUtils.hasText(expectedType) && !expectedType.equals(resourceType)) {
                // TODO 可以不校验资源类型
                // throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "权限资源类型不匹配");
            }
            normalizedNames.add(normalizedResourceName);
        }
        if (normalizedNames.isEmpty()) {
            return List.of();
        }
        return new ArrayList<>(normalizedNames);
    }

    /**
     * 将单个资源规范化为统一路径格式。
     *
     * @param resourceName 原始资源
     * @return 规范化路径
     */
    public String normalizeResourceName(String resourceName) {
        String normalizedResourceName = resourceName.trim();
        if (!normalizedResourceName.startsWith("/")) {
            normalizedResourceName = "/" + normalizedResourceName;
        }
        while (normalizedResourceName.length() > 1
                && normalizedResourceName.endsWith("/")) {
            normalizedResourceName = normalizedResourceName.substring(
                    0,
                    normalizedResourceName.length() - 1
            );
        }
        return normalizedResourceName;
    }

    /**
     * 校验资源是否存在于当前菜单资源集合中。
     *
     * 对普通资源要求精确存在；
     * 对通配资源要求至少命中一条现有资源，避免保存永远不会生效的模式。
     */
    private String resolveResourceType(String resourceName,
                                       Set<String> existingMenuNames,
                                       Set<String> existingApiNames) {
        boolean matchedMenuResource = matchesExistingResource(resourceName, existingMenuNames);
        boolean matchedApiResource = matchesExistingResource(resourceName, existingApiNames);

        if (matchedMenuResource) {
            return PermissionType.MENU;
        }
        if (matchedApiResource) {
            return PermissionType.API;
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在无效的权限资源");
    }

    /**
     * 判断资源是否命中现有资源集合。
     *
     * @param resourceName 资源名
     * @param existingNames 现有资源集合
     * @return 是否命中
     */
    private boolean matchesExistingResource(String resourceName, Set<String> existingNames) {
        if (existingNames.contains(resourceName)) {
            return true;
        }

        for (String existingName : existingNames) {
            if (PermissionPathMatcher.matches(resourceName, existingName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 权限资源拆分结果。
     */
    public static final class PermissionResourceBuckets {
        /**
         * 菜单资源列表。
         */
        private final List<String> menuResources;

        /**
         * 接口资源列表。
         */
        private final List<String> apiResources;

        /**
         * 构造拆分结果。
         *
         * @param menuResources 菜单资源列表
         * @param apiResources 接口资源列表
         */
        public PermissionResourceBuckets(List<String> menuResources,
                                         List<String> apiResources) {
            this.menuResources = menuResources;
            this.apiResources = apiResources;
        }

        /**
         * 获取菜单资源列表。
         *
         * @return 菜单资源列表
         */
        public List<String> getMenuResources() {
            return menuResources;
        }

        /**
         * 获取接口资源列表。
         *
         * @return 接口资源列表
         */
        public List<String> getApiResources() {
            return apiResources;
        }
    }
}
