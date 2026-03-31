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
     * 访问令牌。
     */
    @Schema(description = "访问令牌")
    private String token;

    /**
     * 令牌过期时间戳，单位毫秒。
     */
    @Schema(description = "令牌过期时间戳，单位毫秒")
    private Long expireTime;
}
