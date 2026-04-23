package io.github.modelDesign.asset.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.response.AssetOptionVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 资产下拉选项服务。
 */
@Service
@RequiredArgsConstructor
public class AssetOptionService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 位置 Mapper。
     */
    private final AssetLocationMapper assetLocationMapper;

    /**
     * 分类 Mapper。
     */
    private final AssetCategoryMapper assetCategoryMapper;

    /**
     * 获取用户下拉。
     *
     * @return 用户下拉
     */
    public List<AssetOptionVo> getUserOptions() {
        Long tenantId = requireCurrentTenantId();
        return authUserApi.listUsersByTenantId(tenantId).stream()
                .map(this::toUserOption)
                .toList();
    }

    /**
     * 获取位置下拉。
     *
     * @return 位置下拉
     */
    public List<AssetOptionVo> getLocationOptions() {
        Long tenantId = requireCurrentTenantId();
        return assetLocationMapper.selectList(new LambdaQueryWrapper<AssetLocation>()
                        .eq(AssetLocation::getTenantId, tenantId)
                        .eq(AssetLocation::getStatus, 1)
                        .orderByAsc(AssetLocation::getSort)
                        .orderByAsc(AssetLocation::getId))
                .stream()
                .map(item -> AssetOptionVo.builder()
                        .value(item.getId())
                        .label(item.getName())
                        .build())
                .toList();
    }

    /**
     * 获取分类下拉。
     *
     * @return 分类下拉
     */
    public List<AssetOptionVo> getCategoryOptions() {
        Long tenantId = requireCurrentTenantId();
        return assetCategoryMapper.selectList(new LambdaQueryWrapper<AssetCategory>()
                        .eq(AssetCategory::getTenantId, tenantId)
                        .eq(AssetCategory::getStatus, 1)
                        .orderByAsc(AssetCategory::getSort)
                        .orderByAsc(AssetCategory::getId))
                .stream()
                .map(item -> AssetOptionVo.builder()
                        .value(item.getId())
                        .label(item.getName())
                        .build())
                .toList();
    }

    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser.getTenantId();
    }

    private AssetOptionVo toUserOption(AuthUserSimpleDto user) {
        return AssetOptionVo.builder()
                .value(user.getId())
                .label(user.getNickname() == null ? "" : user.getNickname())
                .build();
    }
}
