package io.github.modelDesign.project.response;

import lombok.Builder;
import lombok.Data;

/**
 * 项目成员。
 */
@Data
@Builder
public class ProjectMemberVo {
    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 头像文件 ID。
     */
    private String avatarId;

    /**
     * 加入时间。
     */
    private String joinedAt;
}
