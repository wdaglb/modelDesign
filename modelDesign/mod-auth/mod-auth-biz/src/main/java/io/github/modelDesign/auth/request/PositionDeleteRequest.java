package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除职位请求。
 */
@Data
@Schema(description = "删除职位请求")
public class PositionDeleteRequest {
    /**
     * 职位 ID。
     */
    @Schema(description = "职位 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "职位 ID 不能为空")
    private Long id;
}
