package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.thirdparty.gitlab.domain.GitlabTenantConfig;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GitLab 配置服务内存测试替身。
 */
class InMemoryGitlabConfigService extends GitlabConfigService {
    /**
     * 按租户保存配置，模拟 MyBatis Plus 持久化行为。
     */
    private final Map<Long, GitlabTenantConfig> configs = new HashMap<>();

    InMemoryGitlabConfigService(
            GitlabTenantContextService gitlabTenantContextService,
            GitlabTokenCipherService gitlabTokenCipherService) {
        super(gitlabTenantContextService, gitlabTokenCipherService);
    }

    @Override
    public boolean save(GitlabTenantConfig entity) {
        entity.setCreateTime(LocalDateTime.now());
        entity.setUpdateTime(LocalDateTime.now());
        configs.put(entity.getTenantId(), entity);
        return true;
    }

    @Override
    public boolean updateById(GitlabTenantConfig entity) {
        entity.setUpdateTime(LocalDateTime.now());
        configs.put(entity.getTenantId(), entity);
        return true;
    }

    @Override
    public GitlabTenantConfig findByTenantId(Long tenantId) {
        return configs.get(tenantId);
    }
}
