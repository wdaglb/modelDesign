package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 登录审计清理结果。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "登录审计清理结果")
public class LoginAuditCleanupResultVo {
    /**
     * 删除数量。
     */
    @Schema(description = "删除数量")
    private Long deletedCount;

    /**
     * 清理范围。
     */
    @Schema(description = "清理范围")
    private String scope;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 保留天数。
     */
    @Schema(description = "保留天数")
    private Integer retentionDays;

    /**
     * 清理截止时间。
     */
    @Schema(description = "清理截止时间")
    private LocalDateTime cutoffTime;

    /**
     * 触发类型。
     */
    @Schema(description = "触发类型")
    private String triggerType;
}
