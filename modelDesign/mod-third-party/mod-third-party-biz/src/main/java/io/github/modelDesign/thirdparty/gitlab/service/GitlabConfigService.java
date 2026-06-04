package io.github.modelDesign.thirdparty.gitlab.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.gitlab.domain.GitlabTenantConfig;
import io.github.modelDesign.thirdparty.gitlab.mapper.GitlabTenantConfigMapper;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabConfigSaveRequest;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * GitLab 租户配置服务。
 */
@Service
@RequiredArgsConstructor
public class GitlabConfigService
        extends ServiceImpl<GitlabTenantConfigMapper, GitlabTenantConfig>
        implements IService<GitlabTenantConfig> {
    /**
     * 默认 GitLab provider 编码。
     */
    public static final String DEFAULT_PROVIDER_CODE = "gitlab-v4";

    /**
     * 默认 GitLab provider 版本。
     */
    public static final String DEFAULT_PROVIDER_VERSION = "1.0.0";

    /**
     * 租户上下文服务。
     */
    private final GitlabTenantContextService gitlabTenantContextService;

    /**
     * Token 加解密服务。
     */
    private final GitlabTokenCipherService gitlabTokenCipherService;

    /**
     * 获取当前租户 GitLab 配置。
     *
     * @return GitLab 配置脱敏信息
     */
    public GitlabConfigVo getCurrentConfig() {
        Long tenantId = gitlabTenantContextService.requireCurrentTenantId();
        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 保存当前租户 GitLab 配置。
     *
     * @param request 保存请求
     * @return 保存后的 GitLab 配置脱敏信息
     */
    public GitlabConfigVo saveCurrentConfig(GitlabConfigSaveRequest request) {
        Long tenantId = gitlabTenantContextService.requireCurrentTenantId();
        GitlabTenantConfig entity = findByTenantId(tenantId);
        String accessTokenCipher = resolveAccessTokenCipher(entity, request.getAccessToken());

        if (entity == null) {
            entity = new GitlabTenantConfig();
            entity.setTenantId(tenantId);
            entity.setServerUrl(normalizeServerUrl(request.getServerUrl()));
            entity.setAccessTokenCipher(accessTokenCipher);
            entity.setEnabled(resolveEnabled(request.getEnabled()));
            entity.setProviderCode(resolveProviderCode(request.getProviderCode()));
            entity.setProviderVersion(resolveProviderVersion(request.getProviderVersion()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            save(entity);
        } else {
            entity.setServerUrl(normalizeServerUrl(request.getServerUrl()));
            entity.setAccessTokenCipher(accessTokenCipher);
            entity.setEnabled(resolveEnabled(request.getEnabled()));
            entity.setProviderCode(resolveProviderCode(request.getProviderCode()));
            entity.setProviderVersion(resolveProviderVersion(request.getProviderVersion()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            updateById(entity);
        }
        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 按租户获取配置，不存在则抛异常。
     *
     * @param tenantId 租户 ID
     * @return GitLab 配置
     */
    public GitlabTenantConfig requireByTenantId(Long tenantId) {
        GitlabTenantConfig config = findByTenantId(tenantId);
        if (config == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "当前租户未配置 GitLab 信息");
        }
        return config;
    }

    /**
     * 读取当前租户启用的 GitLab 配置，并解密 Token。
     *
     * @return 当前租户 GitLab 调用配置
     */
    public GitlabResolvedConfig requireCurrentResolvedConfig() {
        Long tenantId = gitlabTenantContextService.requireCurrentTenantId();
        GitlabTenantConfig config = requireByTenantId(tenantId);
        if (!Boolean.TRUE.equals(config.getEnabled())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前租户 GitLab 配置未启用");
        }
        return new GitlabResolvedConfig(
                config.getTenantId(),
                config.getServerUrl(),
                gitlabTokenCipherService.decrypt(config.getAccessTokenCipher()),
                resolveProviderCode(config.getProviderCode()),
                resolveProviderVersion(config.getProviderVersion())
        );
    }

    /**
     * 按租户获取配置，不存在时返回 null。
     *
     * @param tenantId 租户 ID
     * @return GitLab 配置
     */
    public GitlabTenantConfig findByTenantId(Long tenantId) {
        return lambdaQuery()
                .eq(GitlabTenantConfig::getTenantId, tenantId)
                .last("limit 1")
                .one();
    }

    private String resolveAccessTokenCipher(GitlabTenantConfig entity, String accessToken) {
        if (StringUtils.hasText(accessToken)) {
            return gitlabTokenCipherService.encrypt(accessToken.trim());
        }
        if (entity == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "首次配置 GitLab 时 Token 不能为空");
        }
        return entity.getAccessTokenCipher();
    }

    private GitlabConfigVo toVo(GitlabTenantConfig config) {
        boolean tokenConfigured = StringUtils.hasText(config.getAccessTokenCipher());
        return GitlabConfigVo.builder()
                .tenantId(config.getTenantId())
                .serverUrl(config.getServerUrl())
                .tokenConfigured(tokenConfigured)
                .tokenMasked(maskToken(tokenConfigured))
                .enabled(config.getEnabled())
                .providerCode(resolveProviderCode(config.getProviderCode()))
                .providerVersion(resolveProviderVersion(config.getProviderVersion()))
                .remark(config.getRemark())
                .createTime(config.getCreateTime())
                .updateTime(config.getUpdateTime())
                .build();
    }

    private String normalizeServerUrl(String serverUrl) {
        String normalizedValue = serverUrl.trim();
        while (normalizedValue.endsWith("/")) {
            normalizedValue = normalizedValue.substring(0, normalizedValue.length() - 1);
        }
        try {
            URI uri = new URI(normalizedValue);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 服务器地址仅支持 http 或 https");
            }
            if (!StringUtils.hasText(uri.getHost())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 服务器地址格式错误");
            }
            return normalizedValue;
        } catch (URISyntaxException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 服务器地址格式错误");
        }
    }

    private String normalizeRemark(String remark) {
        if (StringUtils.hasText(remark)) {
            return remark.trim();
        }
        return "";
    }

    private Boolean resolveEnabled(Boolean enabled) {
        if (enabled == null) {
            return Boolean.TRUE;
        }
        return enabled;
    }

    private String resolveProviderCode(String providerCode) {
        if (StringUtils.hasText(providerCode)) {
            return providerCode.trim();
        }
        return DEFAULT_PROVIDER_CODE;
    }

    private String resolveProviderVersion(String providerVersion) {
        if (StringUtils.hasText(providerVersion)) {
            return providerVersion.trim();
        }
        return DEFAULT_PROVIDER_VERSION;
    }

    private String maskToken(boolean tokenConfigured) {
        if (tokenConfigured) {
            return "********";
        }
        return "";
    }
}
