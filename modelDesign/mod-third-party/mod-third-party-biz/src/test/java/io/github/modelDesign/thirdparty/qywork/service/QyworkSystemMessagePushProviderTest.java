package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.api.dto.SystemMessagePushContext;
import io.github.modelDesign.system.api.dto.SystemMessageScopeType;
import io.github.modelDesign.thirdparty.oauth.domain.UserOauth;
import io.github.modelDesign.thirdparty.oauth.service.UserOauthService;
import io.github.modelDesign.thirdparty.qywork.client.QyworkMessageClient;
import io.github.modelDesign.thirdparty.qywork.client.QyworkMessageSendRequest;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 企业微信系统消息 provider 测试。
 */
class QyworkSystemMessagePushProviderTest {
    /**
     * 未绑定企业微信时应跳过发送，且不能抛出导致重试的异常。
     */
    @Test
    void pushShouldSkipWhenUserIsNotBound() {
        UserOauthService userOauthService = mock(UserOauthService.class);
        QyworkSystemMessagePushProvider provider = buildProvider(userOauthService, mock(QyworkMessageClient.class));
        when(userOauthService.findActiveByUser(eq(1L), eq(2L), eq("qywork"))).thenReturn(null);

        provider.push(context());

        verify(userOauthService).findActiveByUser(eq(1L), eq(2L), eq("qywork"));
    }

    /**
     * 已绑定企业微信时应按 providerUserId 发送 markdown 应用消息。
     */
    @Test
    void pushShouldSendMessageWhenUserIsBound() {
        UserOauthService userOauthService = mock(UserOauthService.class);
        QyworkMessageClient messageClient = mock(QyworkMessageClient.class);
        QyworkSystemMessagePushProvider provider = buildProvider(userOauthService, messageClient);
        UserOauth binding = new UserOauth();
        binding.setProviderUserId("qy-user-1");
        when(userOauthService.findActiveByUser(eq(1L), eq(2L), eq("qywork"))).thenReturn(binding);

        provider.push(context());

        ArgumentCaptor<QyworkMessageSendRequest> requestCaptor =
                ArgumentCaptor.forClass(QyworkMessageSendRequest.class);
        verify(messageClient).sendMessage(eq("access-token"), requestCaptor.capture());
        assertEquals("qy-user-1", requestCaptor.getValue().getToUser());
        assertEquals("markdown", requestCaptor.getValue().getMsgType());
        assertEquals(100001, requestCaptor.getValue().getAgentId());
    }

    /**
     * 企业微信发送失败时应抛出异常，让当前 qywork 推送任务进入重试。
     */
    @Test
    void pushShouldPropagateMessageClientFailure() {
        UserOauthService userOauthService = mock(UserOauthService.class);
        QyworkMessageClient messageClient = mock(QyworkMessageClient.class);
        QyworkSystemMessagePushProvider provider = buildProvider(userOauthService, messageClient);
        UserOauth binding = new UserOauth();
        binding.setProviderUserId("qy-user-1");
        when(userOauthService.findActiveByUser(eq(1L), eq(2L), eq("qywork"))).thenReturn(binding);
        org.mockito.Mockito.doThrow(new BusinessException(502, "failed"))
                .when(messageClient)
                .sendMessage(eq("access-token"), any(QyworkMessageSendRequest.class));

        assertThrows(BusinessException.class, () -> provider.push(context()));
    }

    private QyworkSystemMessagePushProvider buildProvider(
            UserOauthService userOauthService,
            QyworkMessageClient messageClient
    ) {
        QyworkCorpConfigService configService = mock(QyworkCorpConfigService.class);
        QyworkAccessTokenService accessTokenService = mock(QyworkAccessTokenService.class);
        QyworkCorpConfig config = new QyworkCorpConfig();
        config.setAgentId("100001");
        when(configService.requireByTenantId(eq(1L))).thenReturn(config);
        when(accessTokenService.getAccessToken(eq(1L), eq(false))).thenReturn("access-token");
        return new QyworkSystemMessagePushProvider(
                userOauthService,
                configService,
                accessTokenService,
                messageClient,
                new QyworkMarkdownMessageBuilder()
        );
    }

    private SystemMessagePushContext context() {
        return SystemMessagePushContext.builder()
                .messageId(10L)
                .scopeType(SystemMessageScopeType.USER)
                .tenantId(1L)
                .receiverUserIds(List.of(2L))
                .title("任务通知")
                .content("请处理任务")
                .redirectUrl("/agile-board/?taskId=10")
                .build();
    }
}
