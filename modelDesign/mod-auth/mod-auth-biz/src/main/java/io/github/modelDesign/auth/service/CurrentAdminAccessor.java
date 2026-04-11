package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * 当前登录管理员上下文访问器。
 *
 * 该组件统一承接“从线程上下文读取当前用户/租户”的逻辑，
 * 避免权限、用户、角色等服务各自复制同样的校验代码。
 */
@Component
public class CurrentAdminAccessor {
    /**
     * 超级管理员用户 ID。
     */
    public static final long SUPER_ADMIN_USER_ID = 1L;

    /**
     * 获取当前登录管理员。
     *
     * @return 当前登录管理员
     */
    public CurrentAdmin requireCurrentAdmin() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录已失效");
        }
        return currentAdmin;
    }

    /**
     * 获取当前登录用户 ID。
     *
     * @return 当前登录用户 ID
     */
    public Long requireCurrentUserId() {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        Long userId = currentAdmin.getUserId();
        if (userId == null || userId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户不存在");
        }
        return userId;
    }

    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前登录租户 ID
     */
    public Long requireCurrentTenantId() {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        Long tenantId = currentAdmin.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }

    /**
     * 判断当前登录租户是否为平台默认租户。
     *
     * @return 是否为平台默认租户
     */
    public boolean isPlatformTenant() {
        Long tenantId = requireCurrentTenantId();
        return TenantService.DEFAULT_TENANT_ID == tenantId;
    }

    /**
     * 判断当前登录用户是否为超级管理员。
     *
     * 当前项目约定 `userId=1` 为内置超级管理员，
     * 需要在权限判断阶段直接放行，避免再依赖角色配置兜底。
     *
     * @return 是否为超级管理员
     */
    public boolean isSuperAdmin() {
        Long userId = requireCurrentUserId();
        return SUPER_ADMIN_USER_ID == userId;
    }
}
