package io.github.modelDesign.thirdparty.oauth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.thirdparty.oauth.domain.UserOauth;
import io.github.modelDesign.thirdparty.oauth.mapper.UserOauthMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * 第三方账号绑定服务。
 */
@Service
public class UserOauthService extends ServiceImpl<UserOauthMapper, UserOauth> implements IService<UserOauth> {
    private static final String STATUS_BOUND = "bound";

    /**
     * 按用户读取当前有效绑定。
     */
    public UserOauth findActiveByUser(Long tenantId, Long userId, String provider) {
        return lambdaQuery()
                .eq(UserOauth::getTenantId, tenantId)
                .eq(UserOauth::getUserId, userId)
                .eq(UserOauth::getProvider, provider)
                .eq(UserOauth::getStatus, STATUS_BOUND)
                .last("limit 1")
                .one();
    }

    /**
     * 按第三方身份读取当前有效绑定。
     */
    public UserOauth findActiveByProviderIdentity(Long tenantId, String provider, String providerAppId, String providerUserId) {
        return lambdaQuery()
                .eq(UserOauth::getTenantId, tenantId)
                .eq(UserOauth::getProvider, provider)
                .eq(UserOauth::getProviderAppId, providerAppId)
                .eq(UserOauth::getProviderUserId, providerUserId)
                .eq(UserOauth::getStatus, STATUS_BOUND)
                .last("limit 1")
                .one();
    }

    /**
     * 保存或更新当前用户的有效绑定。
     */
    public UserOauth saveOrUpdateBinding(
            Long tenantId,
            Long userId,
            String provider,
            String providerAppId,
            String providerUserId,
            String bindSource
    ) {
        UserOauth existing = findActiveByUser(tenantId, userId, provider);
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            UserOauth entity = new UserOauth();
            entity.setTenantId(tenantId);
            entity.setUserId(userId);
            entity.setProvider(provider);
            entity.setProviderAppId(providerAppId);
            entity.setProviderUserId(providerUserId);
            entity.setProviderUnionId("");
            entity.setProviderOpenId("");
            entity.setNickname("");
            entity.setAvatar("");
            entity.setExtraJson("");
            entity.setBindSource(bindSource);
            entity.setStatus(STATUS_BOUND);
            entity.setBoundAt(now);
            entity.setLastAuthAt(now);
            save(entity);
            return entity;
        }
        existing.setProviderAppId(providerAppId);
        existing.setProviderUserId(providerUserId);
        if (StringUtils.hasText(bindSource)) {
            existing.setBindSource(bindSource);
        }
        existing.setStatus(STATUS_BOUND);
        existing.setLastAuthAt(now);
        updateById(existing);
        return existing;
    }
}
