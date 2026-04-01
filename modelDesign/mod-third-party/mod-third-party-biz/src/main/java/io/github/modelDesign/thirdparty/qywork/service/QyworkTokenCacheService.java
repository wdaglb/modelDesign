package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * 企业微信 access token 缓存服务。
 */
@Service
@RequiredArgsConstructor
public class QyworkTokenCacheService {
    /**
     * Redis 模板。
     */
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 企业微信配置。
     */
    private final QyworkProperties qyworkProperties;

    /**
     * 获取缓存中的 access token。
     *
     * @param tenantId 租户 ID
     * @return access token
     */
    public String getAccessToken(Long tenantId) {
        Object value = redisTemplate.opsForValue().get(buildKey(tenantId));
        if (value instanceof String stringValue) {
            if (StringUtils.hasText(stringValue)) {
                return stringValue;
            }
            return null;
        }
        if (value != null) {
            String stringValue = String.valueOf(value);
            if (StringUtils.hasText(stringValue)) {
                return stringValue;
            }
        }
        return null;
    }

    /**
     * 写入 access token 缓存。
     *
     * @param tenantId          租户 ID
     * @param accessToken       access token
     * @param expiresInSeconds 过期秒数
     */
    public void cacheAccessToken(Long tenantId, String accessToken, long expiresInSeconds) {
        redisTemplate.opsForValue().set(buildKey(tenantId), accessToken, Duration.ofSeconds(expiresInSeconds));
    }

    /**
     * 清理 access token 缓存。
     *
     * @param tenantId 租户 ID
     */
    public void evictAccessToken(Long tenantId) {
        redisTemplate.delete(buildKey(tenantId));
    }

    private String buildKey(Long tenantId) {
        return qyworkProperties.getAccessTokenCacheKeyPrefix() + tenantId;
    }
}
