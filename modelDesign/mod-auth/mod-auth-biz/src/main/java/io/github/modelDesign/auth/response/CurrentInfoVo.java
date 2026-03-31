package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "当前登录用户信息")
public class CurrentInfoVo {
    /**
     * 头像文件 ID。
     */
    @Schema(description = "头像文件 ID")
    private String avatarId;

    /**
     * 当前登录流水号。
     */
    @Schema(description = "当前登录流水号")
    private String loginId;

    /**
     * 当前登录 IP。
     */
    @Schema(description = "当前登录 IP")
    private String loginIp;

    /**
     * 用户昵称。
     */
    @Schema(description = "用户昵称")
    private String nickname;

    /**
     * 当前 token 创建时间。
     */
    @Schema(description = "当前 token 创建时间")
    private LocalDateTime tokenCreateTime;

    /**
     * 用户 ID。
     */
    @Schema(description = "用户 ID")
    private Long userId;

    /**
     * 用户名。
     */
    @Schema(description = "用户名")
    private String username;
}
