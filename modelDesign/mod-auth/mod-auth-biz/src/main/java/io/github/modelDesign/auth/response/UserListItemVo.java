package io.github.modelDesign.auth.response;

import lombok.Builder;
import lombok.Data;

/**
 * 用户列表项。
 */
@Data
@Builder
public class UserListItemVo {
    /**
     * 用户 ID。
     */
    private Long id;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 用户名。
     */
    private String username;

    /**
     * 头像文件 ID。
     */
    private String avatarId;

    /**
     * 是否禁用。
     */
    private Boolean isDisable;
}
