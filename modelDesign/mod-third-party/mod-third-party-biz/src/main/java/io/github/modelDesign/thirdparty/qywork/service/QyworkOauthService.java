package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.oauth.domain.UserOauth;
import io.github.modelDesign.thirdparty.oauth.enums.OauthBindingSessionStatus;
import io.github.modelDesign.thirdparty.oauth.model.OauthBindingSession;
import io.github.modelDesign.thirdparty.oauth.service.OauthBindingSessionService;
import io.github.modelDesign.thirdparty.oauth.service.UserOauthService;
import io.github.modelDesign.thirdparty.qywork.client.QyworkOauthClient;
import io.github.modelDesign.thirdparty.qywork.client.QyworkOauthUserInfoResponse;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import io.github.modelDesign.thirdparty.qywork.request.CreateOauthBindingSessionRequest;
import io.github.modelDesign.thirdparty.qywork.response.OauthBindingSessionCreatedVo;
import io.github.modelDesign.thirdparty.qywork.response.OauthBindingSessionStatusVo;
import io.github.modelDesign.thirdparty.qywork.response.UserOauthBindingStatusVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 企业微信 OAuth 绑定服务。
 */
@Service
@RequiredArgsConstructor
public class QyworkOauthService {
    private static final String PROVIDER = "qywork";
    private static final String ENTRY_MODE_IN_APP = "in_app";
    private static final String BIND_SOURCE_IN_APP = "in_app";
    private static final String BIND_SOURCE_QR = "qr_scan";

    private final QyworkTenantContextService qyworkTenantContextService;
    private final QyworkCorpConfigService qyworkCorpConfigService;
    private final QyworkAccessTokenService qyworkAccessTokenService;
    private final QyworkOauthClient qyworkOauthClient;
    private final UserOauthService userOauthService;
    private final OauthBindingSessionService oauthBindingSessionService;
    private final QyworkProperties qyworkProperties;

    /**
     * 获取当前登录用户的企业微信绑定状态。
     */
    public UserOauthBindingStatusVo getCurrentBindingStatus() {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        Long tenantId = qyworkTenantContextService.requireCurrentTenantId();
        QyworkCorpConfig config = qyworkCorpConfigService.findByTenantId(tenantId);
        boolean configReady = isConfigReady(config);
        UserOauth binding = userOauthService.findActiveByUser(tenantId, currentAdmin.getUserId(), PROVIDER);
        boolean isBound = binding != null;

        return UserOauthBindingStatusVo.builder()
                .provider(PROVIDER)
                .configReady(configReady)
                .canStartBinding(configReady && !isBound)
                .isBound(isBound)
                .providerUserId(isBound ? binding.getProviderUserId() : "")
                .boundAt(isBound ? binding.getBoundAt() : null)
                .message(resolveBindingMessage(configReady, isBound))
                .build();
    }

    /**
     * 创建一轮新的企业微信绑定会话。
     */
    public OauthBindingSessionCreatedVo createBindingSession(CreateOauthBindingSessionRequest request) {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        Long tenantId = qyworkTenantContextService.requireCurrentTenantId();
        QyworkCorpConfig config = requireReadyConfig(tenantId);
        UserOauth existingBinding = userOauthService.findActiveByUser(tenantId, currentAdmin.getUserId(), PROVIDER);
        if (existingBinding != null) {
            throw new BusinessException(HttpStatus.CONFLICT.value(), "当前账号已绑定企业微信");
        }

        String providerAppId = buildProviderAppId(config);
        OauthBindingSession session = oauthBindingSessionService.createPendingSession(
                tenantId,
                currentAdmin.getUserId(),
                PROVIDER,
                providerAppId,
                request.getEntryMode(),
                normalizeOrigin(request.getOrigin())
        );

        String callbackUrl = buildCallbackUrl(session.getOrigin());
        String authUrl = buildAuthorizeUrl(
                config.getCorpId(),
                config.getAgentId(),
                callbackUrl,
                session.getStateToken()
        );

        return OauthBindingSessionCreatedVo.builder()
                .sessionId(session.getSessionId())
                .entryMode(session.getEntryMode())
                .authUrl(authUrl)
                .qrCodeUrl(buildScanEntryUrl(session.getOrigin(), session.getSceneToken()))
                .expireAt(session.getExpireAt())
                .pollIntervalMs(2000L)
                .build();
    }

    /**
     * 查询当前绑定会话状态。
     */
    public OauthBindingSessionStatusVo getBindingSessionStatus(String sessionId) {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        OauthBindingSession session = requireSession(sessionId);
        validateSessionOwner(session, currentAdmin);
        if (oauthBindingSessionService.isExpired(session)
                && session.getStatus() != OauthBindingSessionStatus.SUCCESS
                && session.getStatus() != OauthBindingSessionStatus.FAILED
                && session.getStatus() != OauthBindingSessionStatus.EXPIRED) {
            session = oauthBindingSessionService.markExpired(session);
        }
        return toSessionStatusVo(session);
    }

    /**
     * 根据扫码 token 生成真正的企业微信授权地址。
     */
    public String buildAuthorizeUrlBySceneToken(String sceneToken) {
        OauthBindingSession session = oauthBindingSessionService.getBySceneToken(sceneToken);
        if (session == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "绑定会话不存在");
        }
        if (oauthBindingSessionService.isExpired(session)) {
            oauthBindingSessionService.markExpired(session);
            throw new BusinessException(HttpStatus.GONE.value(), "绑定会话已过期");
        }
        oauthBindingSessionService.markAuthorizing(session);
        QyworkCorpConfig config = requireReadyConfig(session.getTenantId());
        return buildAuthorizeUrl(
                config.getCorpId(),
                config.getAgentId(),
                buildCallbackUrl(session.getOrigin()),
                session.getStateToken()
        );
    }

    /**
     * 处理企业微信 OAuth 回调，并返回一个可直接展示给用户的 HTML 结果页。
     */
    public String handleCallback(String code, String stateToken) {
        OauthBindingSession session = oauthBindingSessionService.getByStateToken(stateToken);
        if (session == null) {
            return buildHtmlPage("绑定失败", "未找到对应的绑定会话，请返回原页面重新发起绑定。");
        }
        if (oauthBindingSessionService.isExpired(session)) {
            oauthBindingSessionService.markExpired(session);
            return buildHtmlPage("二维码已过期", "这次绑定会话已经过期，请返回原页面重新发起绑定。");
        }
        oauthBindingSessionService.markBinding(session);

        try {
            QyworkCorpConfig config = requireReadyConfig(session.getTenantId());
            String accessToken = qyworkAccessTokenService.getAccessToken(session.getTenantId(), false);
            QyworkOauthUserInfoResponse userInfo = qyworkOauthClient.getUserInfo(accessToken, code);

            UserOauth conflictBinding = userOauthService.findActiveByProviderIdentity(
                    session.getTenantId(),
                    PROVIDER,
                    buildProviderAppId(config),
                    userInfo.getUserId()
            );
            if (conflictBinding != null && !conflictBinding.getUserId().equals(session.getUserId())) {
                oauthBindingSessionService.markFailed(
                        session,
                        "QYWORK_USER_CONFLICT",
                        "当前企业微信账号已绑定其他系统用户"
                );
                return buildHtmlPage("绑定失败", "当前企业微信账号已绑定其他系统用户，请返回原页面核对后重试。");
            }

            userOauthService.saveOrUpdateBinding(
                    session.getTenantId(),
                    session.getUserId(),
                    PROVIDER,
                    session.getProviderAppId(),
                    userInfo.getUserId(),
                    ENTRY_MODE_IN_APP.equals(session.getEntryMode()) ? BIND_SOURCE_IN_APP : BIND_SOURCE_QR
            );
            oauthBindingSessionService.markSuccess(session, userInfo.getUserId());
            return buildHtmlPage("绑定成功", "企业微信账号已绑定成功，请返回原页面查看最新状态。");
        } catch (BusinessException exception) {
            oauthBindingSessionService.markFailed(session, "UNKNOWN_ERROR", exception.getMessage());
            return buildHtmlPage("绑定失败", exception.getMessage());
        }
    }

    /**
     * 构造企业微信授权地址。
     */
    public String buildAuthorizeUrl(String corpId, String agentId, String callbackUrl, String stateToken) {
        try {
            return UriComponentsBuilder.fromHttpUrl(qyworkProperties.getOauthAuthorizeUrl())
                    .queryParam("appid", corpId)
                    .queryParam("redirect_uri", callbackUrl)
                    .queryParam("response_type", "code")
                    .queryParam("scope", qyworkProperties.getOauthScope())
                    .queryParam("state", stateToken)
                    .queryParam("agentid", agentId)
                    .fragment("wechat_redirect")
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "企业微信授权地址配置错误");
        }
    }

    private OauthBindingSessionStatusVo toSessionStatusVo(OauthBindingSession session) {
        return OauthBindingSessionStatusVo.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus().name().toLowerCase())
                .failCode(session.getFailCode())
                .failMessage(session.getFailMessage())
                .providerUserId(session.getProviderUserId())
                .completedAt(session.getCompletedAt())
                .expireAt(session.getExpireAt())
                .build();
    }

    private OauthBindingSession requireSession(String sessionId) {
        OauthBindingSession session = oauthBindingSessionService.getBySessionId(sessionId);
        if (session == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "绑定会话不存在");
        }
        return session;
    }

    private void validateSessionOwner(OauthBindingSession session, CurrentAdmin currentAdmin) {
        if (!session.getUserId().equals(currentAdmin.getUserId())
                || !session.getTenantId().equals(currentAdmin.getTenantId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权查看该绑定会话");
        }
    }

    private QyworkCorpConfig requireReadyConfig(Long tenantId) {
        QyworkCorpConfig config = qyworkCorpConfigService.requireByTenantId(tenantId);
        if (!isConfigReady(config)) {
            throw new BusinessException(HttpStatus.PRECONDITION_FAILED.value(), "当前租户企业微信配置不完整");
        }
        return config;
    }

    private boolean isConfigReady(QyworkCorpConfig config) {
        return config != null
                && StringUtils.hasText(config.getCorpId())
                && StringUtils.hasText(config.getCorpSecret())
                && StringUtils.hasText(config.getAgentId())
                && Boolean.TRUE.equals(config.getEnabled());
    }

    private String resolveBindingMessage(boolean configReady, boolean isBound) {
        if (!configReady) {
            return "当前租户尚未完成企业微信网页授权配置";
        }
        if (isBound) {
            return "当前账号已绑定企业微信";
        }
        return "当前租户已完成企业微信配置，可发起绑定";
    }

    private String buildProviderAppId(QyworkCorpConfig config) {
        return config.getCorpId() + ":" + config.getAgentId();
    }

    private String buildCallbackUrl(String origin) {
        return origin + "/api/third-party/qywork/oauth/callback";
    }

    private String buildScanEntryUrl(String origin, String sceneToken) {
        return origin + "/api/third-party/qywork/binding/scan-entry?sceneToken=" + sceneToken;
    }

    private String normalizeOrigin(String origin) {
        String normalized = origin == null ? "" : origin.trim();
        if (!StringUtils.hasText(normalized) || !(normalized.startsWith("http://") || normalized.startsWith("https://"))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "origin 格式不正确");
        }
        return normalized;
    }

    private CurrentAdmin requireCurrentAdmin() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null || currentAdmin.getUserId() == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录");
        }
        return currentAdmin;
    }

    private String buildHtmlPage(String title, String message) {
        String safeTitle = HtmlUtils.htmlEscape(title);
        String safeMessage = HtmlUtils.htmlEscape(message);
        return """
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s</title>
                  <style>
                    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; background: #f5f7fb; color: #1f2937; }
                    .panel { max-width: 480px; margin: 72px auto; padding: 32px 24px; background: #fff; border-radius: 20px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); }
                    h1 { margin: 0 0 12px; font-size: 24px; }
                    p { margin: 0; line-height: 1.7; color: #4b5563; }
                  </style>
                </head>
                <body>
                  <div class="panel">
                    <h1>%s</h1>
                    <p>%s</p>
                  </div>
                </body>
                </html>
                """.formatted(safeTitle, safeTitle, safeMessage);
    }
}
