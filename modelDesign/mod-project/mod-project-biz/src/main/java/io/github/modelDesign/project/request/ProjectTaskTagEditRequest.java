package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑任务标签请求。
 */
@Data
@Schema(description = "编辑任务标签请求")
public class ProjectTaskTagEditRequest {
    /**
     * 标签名称。
     */
    @Schema(description = "标签名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "标签名称不能为空")
    @Size(max = 64, message = "标签名称长度不能超过 64 个字符")
    private String name;

    /**
     * 标签颜色。
     */
    @Schema(description = "标签颜色")
    @Size(max = 32, message = "标签颜色长度不能超过 32 个字符")
    private String color;

    /**
     * 排序值。
     */
    @Schema(description = "排序值", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "排序值不能为空")
    private Integer sort;
}
