package io.github.modelDesign.thirdparty.oauth.service;

import io.github.modelDesign.thirdparty.oauth.enums.OauthBindingSessionStatus;
import io.github.modelDesign.thirdparty.oauth.model.OauthBindingSession;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OAuth 绑定短会话服务。
 */
@Service
@RequiredArgsConstructor
public class OauthBindingSessionService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final QyworkProperties qyworkProperties;

    /**
     * 创建待授权状态的绑定会话，并同时建立 session / scene 两类索引。
     *
     * 这里把 state 直接复用为 sessionId，后续 OAuth 回调可直接按 state 定位会话，
     * 避免第一版再额外维护一层 state -> session 的 Redis 映射。
     *
     * @param tenantId       当前租户 ID
     * @param userId         当前系统用户 ID
     * @param provider       平台标识
     * @param providerAppId  平台应用标识
     * @param entryMode      入口模式
     * @return 新创建的会话
     */
    public OauthBindingSession createPendingSession(
            Long tenantId,
            Long userId,
            String provider,
            String providerAppId,
            String entryMode,
            String origin
    ) {
        String sessionId = randomToken();
        String sceneToken = randomToken();
        LocalDateTime now = LocalDateTime.now();
        Duration ttl = Duration.ofSeconds(qyworkProperties.getBindingSessionExpireSeconds());

        OauthBindingSession session = OauthBindingSession.builder()
                .sessionId(sessionId)
                .tenantId(tenantId)
                .userId(userId)
                .provider(provider)
                .providerAppId(providerAppId)
                .entryMode(entryMode)
                .origin(origin)
                .sceneToken(sceneToken)
                .stateToken(sessionId)
                .status(OauthBindingSessionStatus.PENDING)
                .createdAt(now)
                .expireAt(now.plusSeconds(qyworkProperties.getBindingSessionExpireSeconds()))
                .build();

        redisTemplate.opsForValue().set(buildSessionKey(sessionId), session, ttl);
        redisTemplate.opsForValue().set(buildSceneKey(sceneToken), sessionId, ttl);
        return session;
    }

    /**
     * 根据会话 ID 读取会话。
     *
     * @param sessionId 会话 ID
     * @return 会话，不存在时返回 null
     */
    public OauthBindingSession getBySessionId(String sessionId) {
        Object value = redisTemplate.opsForValue().get(buildSessionKey(sessionId));
        if (value instanceof OauthBindingSession session) {
            return session;
        }
        return null;
    }

    /**
     * 根据 sceneToken 读取会话。
     *
     * @param sceneToken 二维码 token
     * @return 会话，不存在时返回 null
     */
    public OauthBindingSession getBySceneToken(String sceneToken) {
        Object value = redisTemplate.opsForValue().get(buildSceneKey(sceneToken));
        if (value == null) {
            return null;
        }
        String sessionId = String.valueOf(value);
        if (!StringUtils.hasText(sessionId)) {
            return null;
        }
        return getBySessionId(sessionId);
    }

    /**
     * 根据 OAuth state 读取会话。第一版 state 直接复用 sessionId。
     *
     * @param stateToken OAuth state
     * @return 会话，不存在时返回 null
     */
    public OauthBindingSession getByStateToken(String stateToken) {
        return getBySessionId(stateToken);
    }

    /**
     * 标记会话进入授权阶段。
     *
     * @param session 会话
     * @return 更新后的会话
     */
    public OauthBindingSession markAuthorizing(OauthBindingSession session) {
        session.setStatus(OauthBindingSessionStatus.AUTHORIZING);
        save(session, resolveRemainingDuration(session));
        return session;
    }

    /**
     * 标记会话进入绑定阶段。
     *
     * @param session 会话
     * @return 更新后的会话
     */
    public OauthBindingSession markBinding(OauthBindingSession session) {
        session.setStatus(OauthBindingSessionStatus.BINDING);
        save(session, resolveRemainingDuration(session));
        return session;
    }

    /**
     * 标记会话绑定成功，并短暂保留结果供前端轮询读取。
     *
     * @param session         会话
     * @param providerUserId  绑定成功的第三方用户标识
     * @return 更新后的会话
     */
    public OauthBindingSession markSuccess(OauthBindingSession session, String providerUserId) {
        session.setStatus(OauthBindingSessionStatus.SUCCESS);
        session.setProviderUserId(providerUserId);
        session.setCompletedAt(LocalDateTime.now());
        save(session, Duration.ofSeconds(qyworkProperties.getBindingResultRetainSeconds()));
        return session;
    }

    /**
     * 标记会话失败，并短暂保留失败原因供前端读取。
     *
     * @param session     会话
     * @param failCode    失败码
     * @param failMessage 失败描述
     * @return 更新后的会话
     */
    public OauthBindingSession markFailed(OauthBindingSession session, String failCode, String failMessage) {
        session.setStatus(OauthBindingSessionStatus.FAILED);
        session.setFailCode(failCode);
        session.setFailMessage(failMessage);
        session.setCompletedAt(LocalDateTime.now());
        save(session, Duration.ofSeconds(qyworkProperties.getBindingResultRetainSeconds()));
        return session;
    }

    /**
     * 标记会话已过期。
     *
     * @param session 会话
     * @return 更新后的会话
     */
    public OauthBindingSession markExpired(OauthBindingSession session) {
        session.setStatus(OauthBindingSessionStatus.EXPIRED);
        session.setCompletedAt(LocalDateTime.now());
        save(session, Duration.ofSeconds(qyworkProperties.getBindingResultRetainSeconds()));
        return session;
    }

    /**
     * 判断会话是否已过期。
     *
     * @param session 会话
     * @return 是否过期
     */
    public boolean isExpired(OauthBindingSession session) {
        if (session == null || session.getExpireAt() == null) {
            return true;
        }
        return session.getExpireAt().isBefore(LocalDateTime.now());
    }

    private void save(OauthBindingSession session, Duration ttl) {
        redisTemplate.opsForValue().set(buildSessionKey(session.getSessionId()), session, ttl);
        redisTemplate.opsForValue().set(buildSceneKey(session.getSceneToken()), session.getSessionId(), ttl);
    }

    private Duration resolveRemainingDuration(OauthBindingSession session) {
        if (session.getExpireAt() == null) {
            return Duration.ofSeconds(qyworkProperties.getBindingSessionExpireSeconds());
        }
        Duration duration = Duration.between(LocalDateTime.now(), session.getExpireAt());
        if (duration.isNegative() || duration.isZero()) {
            return Duration.ofSeconds(1);
        }
        return duration;
    }

    private String buildSessionKey(String sessionId) {
        return qyworkProperties.getBindingSessionKeyPrefix() + sessionId;
    }

    private String buildSceneKey(String sceneToken) {
        return qyworkProperties.getBindingSceneKeyPrefix() + sceneToken;
    }

    private String randomToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
