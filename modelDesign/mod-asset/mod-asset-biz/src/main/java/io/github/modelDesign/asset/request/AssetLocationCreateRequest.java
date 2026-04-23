package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新建设备位置请求。
 */
@Data
@Schema(description = "新建设备位置请求")
public class AssetLocationCreateRequest {
    /**
     * 位置名称。
     */
    @Schema(description = "位置名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "位置名称不能为空")
    @Size(max = 100, message = "位置名称长度不能超过 100 个字符")
    private String name;

    /**
     * 位置编码。
     */
    @Schema(description = "位置编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "位置编码不能为空")
    @Size(max = 64, message = "位置编码长度不能超过 64 个字符")
    private String code;

    /**
     * 父级位置 ID。
     */
    @Schema(description = "父级位置 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "父级位置不能为空")
    private Long parentId;

    /**
     * 负责人 ID。
     */
    @Schema(description = "负责人 ID")
    private Long managerUserId;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort = 1;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
