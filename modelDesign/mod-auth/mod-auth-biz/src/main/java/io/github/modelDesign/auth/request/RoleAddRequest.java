package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增角色请求。
 */
@Data
@Schema(description = "新增角色请求")
public class RoleAddRequest {
    /**
     * 角色名称。
     */
    @Schema(description = "角色名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "角色名称不能为空")
    @Size(max = 50, message = "角色名称长度不能超过 50 个字符")
    private String name;

    /**
     * 角色编码。
     */
    @Schema(description = "角色编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "角色编码不能为空")
    @Size(max = 50, message = "角色编码长度不能超过 50 个字符")
    private String code;

    /**
     * 角色备注。
     */
    @Schema(description = "角色备注")
    @Size(max = 255, message = "角色备注长度不能超过 255 个字符")
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
