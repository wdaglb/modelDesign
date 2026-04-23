package io.github.modelDesign.asset.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.request.AssetLocationCreateRequest;
import io.github.modelDesign.asset.request.AssetLocationEditRequest;
import io.github.modelDesign.asset.response.AssetLocationVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;

/**
 * 设备位置服务。
 */
@Service
@RequiredArgsConstructor
public class AssetLocationService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 位置 Mapper。
     */
    private final AssetLocationMapper assetLocationMapper;

    /**
     * 获取位置列表。
     *
     * @return 位置列表
     */
    public List<AssetLocationVo> getList() {
        Long tenantId = requireCurrentTenantId();
        return assetLocationMapper.selectList(new LambdaQueryWrapper<AssetLocation>()
                        .eq(AssetLocation::getTenantId, tenantId)
                        .orderByAsc(AssetLocation::getParentId)
                        .orderByAsc(AssetLocation::getSort)
                        .orderByAsc(AssetLocation::getId))
                .stream()
                .map(this::toLocationVo)
                .toList();
    }

    /**
     * 新建设备位置。
     *
     * @param request 创建请求
     * @return 位置详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetLocationVo create(AssetLocationCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        validateCodeUnique(tenantId, request.getCode(), null);
        AssetLocation entity = new AssetLocation();
        entity.setTenantId(tenantId);
        entity.setName(normalizeRequiredText(request.getName(), "位置名称不能为空", 100));
        entity.setCode(normalizeRequiredText(request.getCode(), "位置编码不能为空", 64));
        entity.setParentId(request.getParentId());
        entity.setManagerUserId(request.getManagerUserId());
        entity.setSort(request.getSort() == null ? 1 : request.getSort());
        entity.setStatus(1);
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        assetLocationMapper.insert(entity);
        return toLocationVo(entity);
    }

    /**
     * 编辑设备位置。
     *
     * @param id      位置 ID
     * @param request 编辑请求
     * @return 位置详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetLocationVo edit(Long id, AssetLocationEditRequest request) {
        Long tenantId = requireCurrentTenantId();
        AssetLocation entity = requireLocation(id, tenantId);
        validateCodeUnique(tenantId, request.getCode(), id);
        entity.setName(normalizeRequiredText(request.getName(), "位置名称不能为空", 100));
        entity.setCode(normalizeRequiredText(request.getCode(), "位置编码不能为空", 64));
        entity.setParentId(request.getParentId());
        entity.setManagerUserId(request.getManagerUserId());
        entity.setSort(request.getSort() == null ? 1 : request.getSort());
        entity.setStatus(request.getStatus() == null ? 1 : request.getStatus());
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        assetLocationMapper.updateById(entity);
        return toLocationVo(entity);
    }

    private AssetLocation requireLocation(Long id, Long tenantId) {
        AssetLocation entity = assetLocationMapper.selectById(id);
        if (entity == null || !Objects.equals(entity.getTenantId(), tenantId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "位置不存在");
        }
        return entity;
    }

    private void validateCodeUnique(Long tenantId, String code, Long excludeId) {
        LambdaQueryWrapper<AssetLocation> queryWrapper = new LambdaQueryWrapper<AssetLocation>()
                .eq(AssetLocation::getTenantId, tenantId)
                .eq(AssetLocation::getCode, normalizeRequiredText(code, "位置编码不能为空", 64));
        if (excludeId != null) {
            queryWrapper.ne(AssetLocation::getId, excludeId);
        }
        Long count = assetLocationMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "同一租户下位置编码不能重复");
        }
    }

    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser.getTenantId();
    }

    private String normalizeRequiredText(String value, String blankMessage, int maxLength) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), blankMessage);
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "字段长度超出限制");
        }
        return normalizedValue;
    }

    private String normalizeOptionalText(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "字段长度超出限制");
        }
        return normalizedValue;
    }

    private AssetLocationVo toLocationVo(AssetLocation entity) {
        return AssetLocationVo.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .code(entity.getCode())
                .parentId(entity.getParentId())
                .build();
    }
}
