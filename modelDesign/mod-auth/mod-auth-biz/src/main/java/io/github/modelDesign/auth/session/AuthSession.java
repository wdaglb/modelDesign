package io.github.modelDesign.auth.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

/**
 * 登录会话聚合。
 *
 * <p>该对象将当前用户会话与 refresh token 轮换状态绑定到同一条 Redis 记录，
 * 这样可以在刷新 refresh token 时同时完成续期与旧 token 失效。</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSession implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 当前登录管理员信息。
     */
    private CurrentAdmin currentAdmin;

    /**
     * 当前生效的 refresh token 标识。
     */
    private String refreshTokenId;
}
