package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.thirdparty.oauth.model.OauthBindingSession;
import io.github.modelDesign.thirdparty.oauth.service.OauthBindingSessionService;
import io.github.modelDesign.thirdparty.oauth.service.UserOauthService;
import io.github.modelDesign.thirdparty.qywork.client.QyworkOauthClient;
import io.github.modelDesign.thirdparty.qywork.configuration.AppDomainProperties;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import io.github.modelDesign.thirdparty.qywork.request.CreateOauthBindingSessionRequest;
import io.github.modelDesign.thirdparty.qywork.response.OauthBindingSessionCreatedVo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class QyworkOauthServiceTest {
    @Test
    void buildAuthorizeUrlShouldContainAgentIdStateAndWechatRedirect() {
        QyworkProperties properties = new QyworkProperties();
        AppDomainProperties appDomainProperties = new AppDomainProperties();
        appDomainProperties.setDomain("https://host");
        QyworkOauthService service = new QyworkOauthService(
                new QyworkTenantContextService(),
                mock(QyworkCorpConfigService.class),
                mock(QyworkAccessTokenService.class),
                mock(QyworkOauthClient.class),
                mock(UserOauthService.class),
                mock(OauthBindingSessionService.class),
                properties,
                appDomainProperties
        );

        String url = service.buildAuthorizeUrl(
                "ww123",
                "100001",
                "https://host/api/third-party/qywork/oauth/callback",
                "state-1"
        );

        assertTrue(url.contains("appid=ww123"));
        assertTrue(url.contains("agentid=100001"));
        assertTrue(url.contains("state=state-1"));
        assertTrue(url.endsWith("#wechat_redirect"));
    }

    @Test
    void createBindingSessionShouldUseConfiguredAppDomain() {
        QyworkCorpConfigService corpConfigService = mock(QyworkCorpConfigService.class);
        UserOauthService userOauthService = mock(UserOauthService.class);
        OauthBindingSessionService bindingSessionService = mock(OauthBindingSessionService.class);
        QyworkProperties properties = new QyworkProperties();
        AppDomainProperties appDomainProperties = new AppDomainProperties();
        appDomainProperties.setDomain("https://public.example.com/");
        QyworkCorpConfig config = new QyworkCorpConfig();
        config.setCorpId("ww123");
        config.setAgentId("100001");
        config.setCorpSecret("secret");
        config.setEnabled(true);
        when(corpConfigService.requireByTenantId(eq(1L))).thenReturn(config);

        QyworkOauthService service = new QyworkOauthService(
                new QyworkTenantContextService(),
                corpConfigService,
                mock(QyworkAccessTokenService.class),
                mock(QyworkOauthClient.class),
                userOauthService,
                bindingSessionService,
                properties,
                appDomainProperties
        );

        CreateOauthBindingSessionRequest request = new CreateOauthBindingSessionRequest();
        request.setEntryMode("desktop_qr");

        /**
         * 当前单测只验证 app.domain 参与 URL 生成，因此用最小会话对象
         * 固定 scene/state，避免随机 token 影响断言。
         */
        AuthContext.set(
                CurrentAdmin.builder()
                        .tenantId(1L)
                        .userId(2L)
                        .build()
        );
        when(bindingSessionService.createPendingSession(
                eq(1L),
                eq(2L),
                eq("qywork"),
                eq("ww123:100001"),
                eq("desktop_qr"),
                eq("https://public.example.com")
        )).thenReturn(OauthBindingSession.builder()
                .sessionId("session-1")
                .entryMode("desktop_qr")
                .origin("https://public.example.com")
                .sceneToken("scene-1")
                .stateToken("state-1")
                .expireAt(LocalDateTime.now().plusMinutes(5))
                .build());

        try {
            OauthBindingSessionCreatedVo result = service.createBindingSession(request);

            assertEquals(
                    "https://public.example.com/api/third-party/qywork/binding/scan-entry?sceneToken=scene-1",
                    result.getQrCodeUrl()
            );
            assertTrue(result.getAuthUrl().contains(
                    "redirect_uri=https://public.example.com/api/third-party/qywork/oauth/callback"
            ));
        } finally {
            AuthContext.clear();
        }
    }
}
