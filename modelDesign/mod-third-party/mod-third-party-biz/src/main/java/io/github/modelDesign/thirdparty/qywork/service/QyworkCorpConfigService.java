package io.github.modelDesign.thirdparty.qywork.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import io.github.modelDesign.thirdparty.qywork.mapper.QyworkCorpConfigMapper;
import io.github.modelDesign.thirdparty.qywork.request.QyworkConfigSaveRequest;
import io.github.modelDesign.thirdparty.qywork.response.QyworkConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 企业微信配置服务。
 */
@Service
@RequiredArgsConstructor
public class QyworkCorpConfigService extends ServiceImpl<QyworkCorpConfigMapper, QyworkCorpConfig> implements IService<QyworkCorpConfig> {
    /**
     * 租户上下文服务。
     */
    private final QyworkTenantContextService qyworkTenantContextService;

    /**
     * access token 缓存服务。
     */
    private final QyworkTokenCacheService qyworkTokenCacheService;

    /**
     * 获取当前租户企业微信配置。
     *
     * @return 企业微信配置
     */
    public QyworkConfigVo getCurrentConfig() {
        Long tenantId = qyworkTenantContextService.requireCurrentTenantId();
        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 保存当前租户企业微信配置。
     *
     * @param request 保存请求
     * @return 保存后的配置
     */
    public QyworkConfigVo saveCurrentConfig(QyworkConfigSaveRequest request) {
        Long tenantId = qyworkTenantContextService.requireCurrentTenantId();
        validateCorpIdUnique(normalize(request.getCorpId()), tenantId);

        QyworkCorpConfig entity = findByTenantId(tenantId);
        if (entity == null) {
            entity = new QyworkCorpConfig();
            entity.setTenantId(tenantId);
            entity.setCorpId(normalize(request.getCorpId()));
            entity.setCorpSecret(normalize(request.getCorpSecret()));
            entity.setAgentId(normalize(request.getAgentId()));
            entity.setEnabled(resolveEnabled(request.getEnabled()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            save(entity);
        } else {
            entity.setCorpId(normalize(request.getCorpId()));
            entity.setCorpSecret(normalize(request.getCorpSecret()));
            entity.setAgentId(normalize(request.getAgentId()));
            entity.setEnabled(resolveEnabled(request.getEnabled()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            updateById(entity);
        }
        qyworkTokenCacheService.evictAccessToken(tenantId);
        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 按租户获取配置，不存在则抛异常。
     *
     * @param tenantId 租户 ID
     * @return 企业微信配置
     */
    public QyworkCorpConfig requireByTenantId(Long tenantId) {
        QyworkCorpConfig config = findByTenantId(tenantId);
        if (config == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "当前租户未配置企业微信信息");
        }
        return config;
    }

    /**
     * 按租户读取企业微信配置，不存在时返回 null。
     *
     * @param tenantId 租户 ID
     * @return 企业微信配置
     */
    public QyworkCorpConfig findByTenantId(Long tenantId) {
        return lambdaQuery()
                .eq(QyworkCorpConfig::getTenantId, tenantId)
                .last("limit 1")
                .one();
    }

    private void validateCorpIdUnique(String corpId, Long tenantId) {
        QyworkCorpConfig existingConfig = lambdaQuery()
                .eq(QyworkCorpConfig::getCorpId, corpId)
                .ne(QyworkCorpConfig::getTenantId, tenantId)
                .last("limit 1")
                .one();
        if (existingConfig != null) {
            throw new BusinessException(HttpStatus.CONFLICT.value(), "corpId 已被其他租户占用");
        }
    }

    private QyworkConfigVo toVo(QyworkCorpConfig config) {
        return QyworkConfigVo.builder()
                .tenantId(config.getTenantId())
                .corpId(config.getCorpId())
                .corpSecret(config.getCorpSecret())
                .agentId(config.getAgentId())
                .enabled(config.getEnabled())
                .remark(config.getRemark())
                .createTime(config.getCreateTime())
                .updateTime(config.getUpdateTime())
                .build();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
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
}
