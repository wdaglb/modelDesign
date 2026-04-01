package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 系统消息已读请求。
 */
@Data
@Schema(description = "系统消息已读请求")
public class SystemMessageReadRequest {
    /**
     * 消息 ID。
     */
    @Schema(description = "消息 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "消息 ID 不能为空")
    @Min(value = 1, message = "消息 ID 必须大于 0")
    private Long id;
}
