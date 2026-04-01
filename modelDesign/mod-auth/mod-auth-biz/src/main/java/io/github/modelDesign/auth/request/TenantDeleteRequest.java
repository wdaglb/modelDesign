package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除租户请求。
 */
@Data
@Schema(description = "删除租户请求")
public class TenantDeleteRequest {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "租户 ID 不能为空")
    private Long id;
}
