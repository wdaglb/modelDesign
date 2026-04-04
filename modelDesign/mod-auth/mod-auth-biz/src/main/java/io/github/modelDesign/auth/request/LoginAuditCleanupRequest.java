package io.github.modelDesign.auth.request;

import io.github.modelDesign.auth.enums.LoginAuditCleanupScopeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 登录审计清理请求。
 */
@Data
@Schema(description = "登录审计清理请求")
public class LoginAuditCleanupRequest {
    /**
     * 清理范围。
     */
    @NotNull(message = "清理范围不能为空")
    @Schema(description = "清理范围", requiredMode = Schema.RequiredMode.REQUIRED)
    private LoginAuditCleanupScopeEnum scope;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 保留天数。
     */
    @Min(value = 1, message = "保留天数不能小于 1")
    @Schema(description = "保留天数")
    private Integer retentionDays;
}
