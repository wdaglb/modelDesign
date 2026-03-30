package io.github.modelDesign.auth.session;

import io.github.modelDesign.auth.configuration.AuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

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
     * @param currentAdmin 当前登录管理员
     */
    public void save(CurrentAdmin currentAdmin) {
        redisTemplate.opsForValue().set(getKey(currentAdmin.getLoginId()), currentAdmin, getTtl());
    }

    /**
     * 获取登录会话。
     *
     * @param loginId 登录流水号
     * @return 当前登录管理员会话
     */
    public CurrentAdmin get(String loginId) {
        Object value = redisTemplate.opsForValue().get(getKey(loginId));
        if (value instanceof CurrentAdmin currentAdmin) {
            return currentAdmin;
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
     * 刷新登录会话有效期。
     *
     * @param loginId 登录流水号
     */
    public void refresh(String loginId) {
        redisTemplate.expire(getKey(loginId), authProperties.getTokenExpireSeconds(), TimeUnit.SECONDS);
    }

    private String getKey(String loginId) {
        return authProperties.getSessionKeyPrefix() + loginId;
    }

    private Duration getTtl() {
        return Duration.ofSeconds(authProperties.getTokenExpireSeconds());
    }
}
