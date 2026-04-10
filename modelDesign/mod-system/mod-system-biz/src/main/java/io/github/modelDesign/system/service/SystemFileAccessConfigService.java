package io.github.modelDesign.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.domain.SystemFileAccessConfig;
import io.github.modelDesign.system.mapper.SystemFileAccessConfigMapper;
import io.github.modelDesign.system.request.SystemFileAccessConfigSaveRequest;
import io.github.modelDesign.system.response.SystemFileAccessConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 文件访问配置服务。
 */
@Service
@RequiredArgsConstructor
public class SystemFileAccessConfigService
        extends ServiceImpl<SystemFileAccessConfigMapper, SystemFileAccessConfig>
        implements IService<SystemFileAccessConfig> {
    /**
     * 系统模块租户上下文服务。
     */
    private final SystemCurrentTenantContextService systemCurrentTenantContextService;

    /**
     * 获取当前租户文件访问配置。
     *
     * @return 当前租户文件访问配置
     */
    public SystemFileAccessConfigVo getCurrentConfig() {
        Long tenantId = systemCurrentTenantContextService.requireCurrentTenantId();
        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 保存当前租户文件访问配置。
     *
     * @param request 保存请求
     * @return 保存后的配置
     */
    public SystemFileAccessConfigVo saveCurrentConfig(
            SystemFileAccessConfigSaveRequest request) {
        Long tenantId = systemCurrentTenantContextService.requireCurrentTenantId();
        SystemFileAccessConfig entity = findByTenantId(tenantId);

        if (entity == null) {
            entity = new SystemFileAccessConfig();
            entity.setTenantId(tenantId);
            entity.setAccessDomain(normalizeAccessDomain(request.getAccessDomain()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            save(entity);
        } else {
            entity.setAccessDomain(normalizeAccessDomain(request.getAccessDomain()));
            entity.setRemark(normalizeRemark(request.getRemark()));
            updateById(entity);
        }

        return toVo(requireByTenantId(tenantId));
    }

    /**
     * 按租户获取配置，不存在则抛异常。
     *
     * @param tenantId 租户 ID
     * @return 文件访问配置
     */
    public SystemFileAccessConfig requireByTenantId(Long tenantId) {
        SystemFileAccessConfig config = findByTenantId(tenantId);
        if (config == null) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND.value(),
                    "当前租户未配置文件访问域名"
            );
        }
        return config;
    }

    /**
     * 按租户获取配置，不存在时返回 null。
     *
     * @param tenantId 租户 ID
     * @return 文件访问配置
     */
    public SystemFileAccessConfig findByTenantId(Long tenantId) {
        return lambdaQuery()
                .eq(SystemFileAccessConfig::getTenantId, tenantId)
                .last("limit 1")
                .one();
    }

    private SystemFileAccessConfigVo toVo(SystemFileAccessConfig config) {
        return SystemFileAccessConfigVo.builder()
                .tenantId(config.getTenantId())
                .accessDomain(config.getAccessDomain())
                .remark(config.getRemark())
                .createTime(config.getCreateTime())
                .updateTime(config.getUpdateTime())
                .build();
    }

    private String normalizeAccessDomain(String accessDomain) {
        String normalizedValue = accessDomain.trim();
        while (normalizedValue.endsWith("/")) {
            normalizedValue = normalizedValue.substring(
                    0,
                    normalizedValue.length() - 1
            );
        }
        return normalizedValue;
    }

    private String normalizeRemark(String remark) {
        if (StringUtils.hasText(remark)) {
            return remark.trim();
        }
        return "";
    }
}
