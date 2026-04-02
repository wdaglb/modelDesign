package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改职位状态请求。
 */
@Data
@Schema(description = "修改职位状态请求")
public class PositionUpdateStatusRequest {
    /**
     * 职位 ID。
     */
    @Schema(description = "职位 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "职位 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "职位状态不能为空")
    private Boolean isDisable;
}
