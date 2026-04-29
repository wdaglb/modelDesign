package io.github.modelDesign.auth.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 当前登录管理员会话。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentAdmin implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 当前租户 ID。
     */
    private Long tenantId;

    /**
     * 登录用户名。
     */
    private String username;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 头像文件 ID。
     */
    private String avatarId;

    /**
     * Git 用户名。
     */
    private String gitUsername;

    /**
     * 登录流水号。
     */
    private String loginId;

    /**
     * 登录 IP。
     */
    private String loginIp;

    /**
     * token 创建时间。
     */
    private LocalDateTime tokenCreateTime;
}
