package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑职位请求。
 */
@Data
@Schema(description = "编辑职位请求")
public class PositionUpdateRequest {
    /**
     * 所属租户 ID。
     */
    @Schema(description = "所属租户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "所属租户不能为空")
    private Long tenantId;

    /**
     * 职位名称。
     */
    @Schema(description = "职位名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "职位名称不能为空")
    @Size(max = 64, message = "职位名称长度不能超过 64 个字符")
    private String name;

    /**
     * 职位编码。
     */
    @Schema(description = "职位编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "职位编码不能为空")
    @Size(max = 64, message = "职位编码长度不能超过 64 个字符")
    private String code;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    @Min(value = 0, message = "排序值不能小于 0")
    private Integer sort;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
