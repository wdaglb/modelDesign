package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.enums.LoginAuditCleanupScopeEnum;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.response.LoginAuditCleanupResultVo;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 登录审计清理服务。
 */
@Service
@RequiredArgsConstructor
public class LoginAuditCleanupService {
    /**
     * 平台管理员角色编码。
     */
    private static final String SUPER_ROLE_CODE = "super";

    /**
     * 租户管理员角色编码。
     */
    private static final String TENANT_ROLE_CODE = "tenant";

    /**
     * 登录历史服务。
     */
    private final UserLoginHistoryService userLoginHistoryService;

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 认证配置。
     */
    private final AuthProperties authProperties;

    /**
     * 执行全局清理。
     *
     * @param retentionDays 保留天数
     * @param operatorUserId 操作用户 ID
     * @param operatorTenantId 操作租户 ID
     * @param triggerType 触发类型
     * @return 清理结果
     */
    public LoginAuditCleanupResultVo cleanupGlobal(Integer retentionDays,
                                                   Long operatorUserId,
                                                   Long operatorTenantId,
                                                   LoginAuditCleanupTriggerTypeEnum triggerType) {
        if (LoginAuditCleanupTriggerTypeEnum.MANUAL.equals(triggerType)) {
            requireSuperRole(operatorUserId);
        }
        return cleanup(
                null,
                retentionDays,
                LoginAuditCleanupScopeEnum.GLOBAL,
                triggerType
        );
    }

    /**
     * 执行租户范围清理。
     *
     * @param tenantId 目标租户 ID
     * @param retentionDays 保留天数
     * @param operatorUserId 操作用户 ID
     * @param operatorTenantId 操作租户 ID
     * @param triggerType 触发类型
     * @return 清理结果
     */
    public LoginAuditCleanupResultVo cleanupByTenant(Long tenantId,
                                                     Integer retentionDays,
                                                     Long operatorUserId,
                                                     Long operatorTenantId,
                                                     LoginAuditCleanupTriggerTypeEnum triggerType) {
        requireTenantId(tenantId);
        if (LoginAuditCleanupTriggerTypeEnum.MANUAL.equals(triggerType)) {
            requireTenantScope(operatorUserId, operatorTenantId, tenantId);
        }
        return cleanup(
                tenantId,
                retentionDays,
                LoginAuditCleanupScopeEnum.TENANT,
                triggerType
        );
    }

    /**
     * 执行统一清理逻辑。
     *
     * @param tenantId 目标租户 ID
     * @param retentionDays 保留天数
     * @param scope 清理范围
     * @param triggerType 触发类型
     * @return 清理结果
     */
    private LoginAuditCleanupResultVo cleanup(Long tenantId,
                                              Integer retentionDays,
                                              LoginAuditCleanupScopeEnum scope,
                                              LoginAuditCleanupTriggerTypeEnum triggerType) {
        int effectiveRetentionDays = resolveRetentionDays(retentionDays);
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(effectiveRetentionDays);
        long deletedCount = userLoginHistoryService.deleteHistoryBefore(cutoffTime, tenantId);
        return LoginAuditCleanupResultVo.builder()
                .deletedCount(deletedCount)
                .scope(scope.name())
                .tenantId(tenantId)
                .retentionDays(effectiveRetentionDays)
                .cutoffTime(cutoffTime)
                .triggerType(triggerType.name())
                .build();
    }

    /**
     * 校验全局清理权限。
     *
     * @param operatorUserId 操作用户 ID
     */
    private void requireSuperRole(Long operatorUserId) {
        List<String> roles = permissionService.getUserRoles(String.valueOf(operatorUserId));
        if (roles == null || !roles.contains(SUPER_ROLE_CODE)) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权执行全局清理");
        }
    }

    /**
     * 校验租户范围清理权限。
     *
     * @param operatorUserId 操作用户 ID
     * @param operatorTenantId 操作租户 ID
     * @param targetTenantId 目标租户 ID
     */
    private void requireTenantScope(Long operatorUserId,
                                    Long operatorTenantId,
                                    Long targetTenantId) {
        List<String> roles = permissionService.getUserRoles(String.valueOf(operatorUserId));
        if (roles != null && roles.contains(SUPER_ROLE_CODE)) {
            return;
        }
        if (roles == null || !roles.contains(TENANT_ROLE_CODE)) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权执行租户清理");
        }
        if (operatorTenantId == null || !operatorTenantId.equals(targetTenantId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权清理其它租户日志");
        }
    }

    /**
     * 解析保留天数，空值时回退默认值。
     *
     * @param retentionDays 保留天数
     * @return 有效保留天数
     */
    private int resolveRetentionDays(Integer retentionDays) {
        int effectiveRetentionDays = authProperties.getLoginAuditRetentionDays();
        if (retentionDays != null) {
            effectiveRetentionDays = retentionDays;
        }
        if (effectiveRetentionDays < 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "保留天数不能小于 1");
        }
        return effectiveRetentionDays;
    }

    /**
     * 校验租户 ID。
     *
     * @param tenantId 租户 ID
     */
    private void requireTenantId(Long tenantId) {
        if (tenantId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不能为空");
        }
    }
}
