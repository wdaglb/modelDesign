package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.thirdparty.oauth.service.OauthBindingSessionService;
import io.github.modelDesign.thirdparty.oauth.service.UserOauthService;
import io.github.modelDesign.thirdparty.qywork.client.QyworkOauthClient;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class QyworkOauthServiceTest {
    @Test
    void buildAuthorizeUrlShouldContainAgentIdStateAndWechatRedirect() {
        QyworkProperties properties = new QyworkProperties();
        QyworkOauthService service = new QyworkOauthService(
                new QyworkTenantContextService(),
                mock(QyworkCorpConfigService.class),
                mock(QyworkAccessTokenService.class),
                mock(QyworkOauthClient.class),
                mock(UserOauthService.class),
                mock(OauthBindingSessionService.class),
                properties
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
}
