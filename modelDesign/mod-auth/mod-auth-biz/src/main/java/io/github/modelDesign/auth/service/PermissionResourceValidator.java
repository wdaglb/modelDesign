package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.constant.PermissionResource;
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

    public PermissionResourceValidator(MenuService menuService) {
        this.menuService = menuService;
    }

    /**
     * 校验并规范化资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @return 规范化后的资源列表
     */
    public List<String> normalizeResourceNames(List<String> resourceNames, Long tenantId) {
        if (resourceNames == null || resourceNames.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<String> normalizedNames = new LinkedHashSet<>();
        Set<String> existingNames = menuService.getAllNameSet();
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
            validateResourceExists(normalizedResourceName, existingNames);
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
    private void validateResourceExists(String resourceName, Set<String> existingNames) {
        if (existingNames.contains(resourceName)) {
            return;
        }

        for (String existingName : existingNames) {
            if (PermissionPathMatcher.matches(resourceName, existingName)) {
                return;
            }
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在无效的权限资源");
    }
}
