package io.github.modelDesign.auth.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 登录审计清理范围枚举。
 */
@Schema(description = "登录审计清理范围")
public enum LoginAuditCleanupScopeEnum {
    /**
     * 全局范围。
     */
    GLOBAL,

    /**
     * 租户范围。
     */
    TENANT
}
