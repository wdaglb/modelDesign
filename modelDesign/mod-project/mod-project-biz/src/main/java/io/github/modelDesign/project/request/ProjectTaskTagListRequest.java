package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 任务标签列表请求。
 */
@Data
@Schema(description = "任务标签列表请求")
public class ProjectTaskTagListRequest {
    /**
     * 标签名称关键字。
     */
    @Schema(description = "标签名称关键字")
    @Size(max = 64, message = "标签名称长度不能超过 64 个字符")
    private String name;
}
