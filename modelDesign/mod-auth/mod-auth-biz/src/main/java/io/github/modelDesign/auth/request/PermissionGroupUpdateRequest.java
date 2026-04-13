package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑权限资源组请求。
 */
@Data
@Schema(description = "编辑权限资源组请求")
public class PermissionGroupUpdateRequest {
    /**
     * 资源组名称。
     */
    @Schema(description = "资源组名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "资源组名称不能为空")
    @Size(max = 100, message = "资源组名称长度不能超过 100 个字符")
    private String name;

    /**
     * 资源组编码。
     */
    @Schema(description = "资源组编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "资源组编码不能为空")
    @Size(max = 100, message = "资源组编码长度不能超过 100 个字符")
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
    @Schema(description = "排序值", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "排序值不能为空")
    private Integer sort;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
