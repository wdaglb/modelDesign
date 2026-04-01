package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增租户请求。
 */
@Data
@Schema(description = "新增租户请求")
public class TenantAddRequest {
    /**
     * 租户编码。
     */
    @Schema(description = "租户编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "租户编码不能为空")
    @Size(max = 64, message = "租户编码长度不能超过 64 个字符")
    private String code;

    /**
     * 租户名称。
     */
    @Schema(description = "租户名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "租户名称不能为空")
    @Size(max = 64, message = "租户名称长度不能超过 64 个字符")
    private String name;

    /**
     * 租户描述。
     */
    @Schema(description = "租户描述")
    @Size(max = 255, message = "租户描述长度不能超过 255 个字符")
    private String description;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
