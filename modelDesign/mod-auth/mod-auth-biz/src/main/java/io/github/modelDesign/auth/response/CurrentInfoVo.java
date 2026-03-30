package io.github.modelDesign.auth.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 当前登录用户信息。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentInfoVo {
    /**
     * 头像文件 ID。
     */
    private String avatarId;

    /**
     * 当前登录流水号。
     */
    private String loginId;

    /**
     * 当前登录 IP。
     */
    private String loginIp;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 当前 token 创建时间。
     */
    private LocalDateTime tokenCreateTime;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 用户名。
     */
    private String username;
}
