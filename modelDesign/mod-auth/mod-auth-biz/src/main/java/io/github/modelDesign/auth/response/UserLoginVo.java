package io.github.modelDesign.auth.response;

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
public class UserLoginVo {
    /**
     * 访问令牌。
     */
    private String token;

    /**
     * 令牌过期时间戳，单位毫秒。
     */
    private Long expireTime;
}
