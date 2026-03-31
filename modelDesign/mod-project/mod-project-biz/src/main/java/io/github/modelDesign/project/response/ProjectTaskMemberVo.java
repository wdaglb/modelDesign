package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 项目任务成员。
 */
@Data
@Builder
@Schema(description = "项目任务成员")
public class ProjectTaskMemberVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long taskId;

    /**
     * 用户 ID。
     */
    @Schema(description = "用户 ID")
    private Long userId;

    /**
     * 用户昵称。
     */
    @Schema(description = "用户昵称")
    private String nickname;

    /**
     * 头像文件 ID。
     */
    @Schema(description = "头像文件 ID")
    private String avatarId;

    /**
     * 加入时间。
     */
    @Schema(description = "加入时间")
    private String joinedAt;
}
