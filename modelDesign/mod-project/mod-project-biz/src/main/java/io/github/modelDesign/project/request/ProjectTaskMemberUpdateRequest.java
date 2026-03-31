package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 项目任务成员变更请求。
 */
@Data
@Schema(description = "项目任务成员变更请求")
public class ProjectTaskMemberUpdateRequest {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "任务 ID 不能为空")
    private Long taskId;

    /**
     * 用户 ID 列表。
     */
    @Schema(description = "用户 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "用户 ID 不能为空")
    private List<@NotNull(message = "用户 ID 不能为空") Long> userIds;
}
