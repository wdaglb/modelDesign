package io.github.modelDesign.auth.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 登录审计清理触发类型枚举。
 */
@Schema(description = "登录审计清理触发类型")
public enum LoginAuditCleanupTriggerTypeEnum {
    /**
     * 手动触发。
     */
    MANUAL,

    /**
     * 定时触发。
     */
    SCHEDULED
}
