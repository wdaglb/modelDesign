package io.github.modelDesign.auth.session;

import io.github.modelDesign.auth.configuration.AuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

/**
 * 登录会话仓储。
 */
@Repository
@RequiredArgsConstructor
public class SessionRepository {
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuthProperties authProperties;

    /**
     * 保存登录会话。
     *
     * @param currentAdmin    当前登录管理员
     * @param refreshTokenId refresh token 标识
     */
    public void save(CurrentAdmin currentAdmin, String refreshTokenId) {
        AuthSession authSession = AuthSession.builder()
                .currentAdmin(currentAdmin)
                .refreshTokenId(refreshTokenId)
                .build();
        redisTemplate.opsForValue().set(
                getKey(currentAdmin.getLoginId()),
                authSession,
                getTtl()
        );
    }

    /**
     * 获取登录会话。
     *
     * @param loginId 登录流水号
     * @return 当前登录管理员会话
     */
    public CurrentAdmin get(String loginId) {
        AuthSession authSession = getSession(loginId);
        if (authSession == null) {
            return null;
        }
        return authSession.getCurrentAdmin();
    }

    /**
     * 获取完整登录会话。
     *
     * @param loginId 登录流水号
     * @return 登录会话聚合
     */
    public AuthSession getSession(String loginId) {
        Object value = redisTemplate.opsForValue().get(getKey(loginId));
        if (value instanceof AuthSession authSession) {
            return authSession;
        }
        return null;
    }

    /**
     * 删除登录会话。
     *
     * @param loginId 登录流水号
     */
    public void remove(String loginId) {
        redisTemplate.delete(getKey(loginId));
    }

    /**
     * 更新当前登录用户会话内容。
     *
     * @param currentAdmin 当前登录管理员
     */
    public void updateCurrentAdmin(CurrentAdmin currentAdmin) {
        AuthSession authSession = getSession(currentAdmin.getLoginId());
        if (authSession == null) {
            return;
        }
        save(currentAdmin, authSession.getRefreshTokenId());
    }

    private String getKey(String loginId) {
        return authProperties.getSessionKeyPrefix() + loginId;
    }

    private Duration getTtl() {
        return Duration.ofSeconds(authProperties.getRefreshTokenExpireSeconds());
    }
}
