package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 删除项目任务请求。
 */
@Data
@Schema(description = "删除项目任务请求")
public class ProjectTaskDeleteRequest {
    /**
     * 任务 ID 列表。
     */
    @Schema(description = "任务 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "任务 ID 不能为空")
    private List<@NotNull(message = "任务 ID 不能为空") Long> ids;
}
