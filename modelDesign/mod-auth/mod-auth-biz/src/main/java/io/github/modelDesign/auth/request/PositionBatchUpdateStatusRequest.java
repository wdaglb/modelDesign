package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量修改职位状态请求。
 */
@Data
@Schema(description = "批量修改职位状态请求")
public class PositionBatchUpdateStatusRequest {
    /**
     * 职位 ID 列表。
     */
    @Schema(description = "职位 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "职位 ID 不能为空")
    private List<@NotNull(message = "职位 ID 不能为空") Long> ids;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "职位状态不能为空")
    private Boolean isDisable;
}
