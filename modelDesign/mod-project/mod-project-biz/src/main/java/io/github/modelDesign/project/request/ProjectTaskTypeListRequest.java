package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 任务类型列表请求。
 */
@Data
@Schema(description = "任务类型列表请求")
public class ProjectTaskTypeListRequest {
    /**
     * 类型名称关键字。
     */
    @Schema(description = "类型名称关键字")
    @Size(max = 64, message = "类型名称长度不能超过 64 个字符")
    private String name;
}
