package io.github.modelDesign.thirdparty.oauth.service;

import io.github.modelDesign.thirdparty.oauth.enums.OauthBindingSessionStatus;
import io.github.modelDesign.thirdparty.oauth.model.OauthBindingSession;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OauthBindingSessionServiceTest {
    @Test
    void createSessionShouldWritePendingStateWithExpireAt() {
        @SuppressWarnings("unchecked")
        RedisTemplate<String, Object> redisTemplate = mock(RedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, Object> valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        QyworkProperties properties = new QyworkProperties();
        properties.setBindingSessionKeyPrefix("oauth:binding:session:");
        properties.setBindingSceneKeyPrefix("oauth:binding:scene:");
        properties.setBindingSessionExpireSeconds(300L);

        OauthBindingSessionService service = new OauthBindingSessionService(redisTemplate, properties);
        OauthBindingSession session = service.createPendingSession(
                1L,
                2L,
                "qywork",
                "ww123:100001",
                "desktop_qr",
                "https://example.com"
        );

        assertNotNull(session.getSessionId());
        assertNotNull(session.getSceneToken());
        assertEquals(session.getSessionId(), session.getStateToken());
        assertEquals(OauthBindingSessionStatus.PENDING, session.getStatus());
        verify(valueOperations, times(2)).set(anyString(), any(), any(Duration.class));
        verify(valueOperations).set(startsWith("oauth:binding:session:"), any(), any(Duration.class));
        verify(valueOperations).set(startsWith("oauth:binding:scene:"), any(), any(Duration.class));
    }
}
