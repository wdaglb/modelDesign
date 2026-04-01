package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.thirdparty.qywork.client.QyworkAccessTokenClient;
import io.github.modelDesign.thirdparty.qywork.client.QyworkAccessTokenResult;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 企业微信 access token 服务。
 */
@Service
@RequiredArgsConstructor
public class QyworkAccessTokenService {
    /**
     * 企业微信配置服务。
     */
    private final QyworkCorpConfigService qyworkCorpConfigService;

    /**
     * 企业微信客户端。
     */
    private final QyworkAccessTokenClient qyworkAccessTokenClient;

    /**
     * access token 缓存服务。
     */
    private final QyworkTokenCacheService qyworkTokenCacheService;

    /**
     * 企业微信配置。
     */
    private final QyworkProperties qyworkProperties;

    /**
     * 租户上下文服务。
     */
    private final QyworkTenantContextService qyworkTenantContextService;

    /**
     * 获取指定租户的 access token。
     *
     * @param tenantId      租户 ID
     * @param forceRefresh 是否强制刷新
     * @return access token
     */
    public String getAccessToken(Long tenantId, boolean forceRefresh) {
        if (!forceRefresh) {
            String cachedAccessToken = qyworkTokenCacheService.getAccessToken(tenantId);
            if (StringUtils.hasText(cachedAccessToken)) {
                return cachedAccessToken;
            }
        }
        QyworkCorpConfig config = qyworkCorpConfigService.requireByTenantId(tenantId);
        QyworkAccessTokenResult tokenResult = qyworkAccessTokenClient.getAccessToken(config.getCorpId(), config.getCorpSecret());
        qyworkTokenCacheService.cacheAccessToken(
                tenantId,
                tokenResult.getAccessToken(),
                resolveCacheSeconds(tokenResult.getExpiresIn())
        );
        return tokenResult.getAccessToken();
    }

    /**
     * 获取当前租户的 access token。
     *
     * @param forceRefresh 是否强制刷新
     * @return access token
     */
    public String getCurrentTenantAccessToken(boolean forceRefresh) {
        Long tenantId = qyworkTenantContextService.requireCurrentTenantId();
        return getAccessToken(tenantId, forceRefresh);
    }

    private long resolveCacheSeconds(Long expiresIn) {
        long cacheSeconds = expiresIn - qyworkProperties.getAccessTokenRefreshAdvanceSeconds();
        if (cacheSeconds <= 0) {
            cacheSeconds = expiresIn;
        }
        return cacheSeconds;
    }
}
