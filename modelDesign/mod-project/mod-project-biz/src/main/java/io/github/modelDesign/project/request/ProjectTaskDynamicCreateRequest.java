package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 创建任务动态请求。
 */
@Data
@Schema(description = "创建任务动态请求")
public class ProjectTaskDynamicCreateRequest {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "任务 ID 不能为空")
    private Long taskId;

    /**
     * 动态内容。
     */
    @Schema(description = "动态内容", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "动态内容不能为空")
    @Size(max = 1000, message = "动态内容长度不能超过 1000 个字符")
    private String content;

    /**
     * 被 @ 的用户 ID 集合。
     */
    @Schema(description = "被 @ 的用户 ID 集合")
    private List<Long> mentionedUserIds;
}
