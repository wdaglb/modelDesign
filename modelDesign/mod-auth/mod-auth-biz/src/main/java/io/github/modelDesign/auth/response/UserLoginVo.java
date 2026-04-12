package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "登录响应")
public class UserLoginVo {
    /**
     * access token。
     */
    @Schema(description = "access token")
    private String accessToken;

    /**
     * access token 过期时间戳，单位毫秒。
     */
    @Schema(description = "access token 过期时间戳，单位毫秒")
    private Long accessExpireTime;

    /**
     * refresh token。
     */
    @Schema(description = "refresh token")
    private String refreshToken;

    /**
     * refresh token 过期时间戳，单位毫秒。
     */
    @Schema(description = "refresh token 过期时间戳，单位毫秒")
    private Long refreshExpireTime;
}
