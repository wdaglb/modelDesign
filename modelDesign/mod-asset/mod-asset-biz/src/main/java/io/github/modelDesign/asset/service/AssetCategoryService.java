package io.github.modelDesign.asset.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.request.AssetCategoryCreateRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteCheckRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteRequest;
import io.github.modelDesign.asset.request.AssetCategoryEditRequest;
import io.github.modelDesign.asset.response.AssetCategoryDeleteCheckItemVo;
import io.github.modelDesign.asset.response.AssetCategoryDeleteCheckVo;
import io.github.modelDesign.asset.response.AssetCategoryVo;
import io.github.modelDesign.asset.response.AssetOptionVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 设备分类服务。
 */
@Service
@RequiredArgsConstructor
public class AssetCategoryService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 分类 Mapper。
     */
    private final AssetCategoryMapper assetCategoryMapper;

    /**
     * 设备台账 Mapper。
     */
    private final AssetDeviceMapper assetDeviceMapper;

    /**
     * 获取当前租户的设备分类列表。
     *
     * @return 设备分类列表
     */
    public List<AssetCategoryVo> getList() {
        Long tenantId = requireCurrentTenantId();
        return assetCategoryMapper.selectList(new LambdaQueryWrapper<AssetCategory>()
                        .eq(AssetCategory::getTenantId, tenantId)
                        .orderByAsc(AssetCategory::getSort)
                        .orderByAsc(AssetCategory::getId))
                .stream()
                .map(this::toCategoryVo)
                .toList();
    }

    /**
     * 新建设备分类。
     *
     * @param request 创建请求
     * @return 分类详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetCategoryVo create(AssetCategoryCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        String name = normalizeRequiredText(request.getName(), "分类名称不能为空", 100);
        validateNameUnique(tenantId, name, null);

        AssetCategory entity = new AssetCategory();
        entity.setTenantId(tenantId);
        entity.setName(name);
        entity.setSort(resolveSort(request.getSort()));
        entity.setStatus(1);
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        assetCategoryMapper.insert(entity);
        return toCategoryVo(entity);
    }

    /**
     * 编辑设备分类。
     *
     * @param id      分类 ID
     * @param request 编辑请求
     * @return 分类详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetCategoryVo edit(Long id, AssetCategoryEditRequest request) {
        Long tenantId = requireCurrentTenantId();
        AssetCategory entity = requireCategory(id, tenantId);
        String name = normalizeRequiredText(request.getName(), "分类名称不能为空", 100);
        validateNameUnique(tenantId, name, id);

        entity.setName(name);
        entity.setSort(resolveSort(request.getSort()));
        entity.setStatus(resolveStatus(request.getStatus()));
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        assetCategoryMapper.updateById(entity);
        return toCategoryVo(entity);
    }

    /**
     * 检查分类删除前的引用情况。
     *
     * @param request 删除前检查请求
     * @return 删除前检查结果
     */
    public AssetCategoryDeleteCheckVo checkDelete(AssetCategoryDeleteCheckRequest request) {
        Long tenantId = requireCurrentTenantId();
        List<Long> categoryIds = normalizeCategoryIds(request.getIds());
        List<AssetCategory> categories = requireCategories(categoryIds, tenantId);
        Map<Long, Long> referenceCountMap = countDeviceReferences(categoryIds, tenantId);
        List<AssetCategoryDeleteCheckItemVo> items = categories.stream()
                .map(category -> {
                    Long referenceCount = referenceCountMap.getOrDefault(category.getId(), 0L);
                    return AssetCategoryDeleteCheckItemVo.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .referenceCount(referenceCount)
                            .needTransfer(referenceCount > 0)
                            .build();
                })
                .toList();
        long totalReferenceCount = items.stream()
                .map(AssetCategoryDeleteCheckItemVo::getReferenceCount)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();
        boolean needTransfer = totalReferenceCount > 0;

        return AssetCategoryDeleteCheckVo.builder()
                .items(items)
                .totalReferenceCount(totalReferenceCount)
                .needTransfer(needTransfer)
                .transferOptions(buildTransferOptions(tenantId, categoryIds))
                .build();
    }

    /**
     * 删除分类；若分类仍被设备引用，则先迁移引用后再删除。
     *
     * @param request 删除请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategories(AssetCategoryDeleteRequest request) {
        Long tenantId = requireCurrentTenantId();
        List<Long> categoryIds = normalizeCategoryIds(request.getIds());
        requireCategories(categoryIds, tenantId);
        Map<Long, Long> referenceCountMap = countDeviceReferences(categoryIds, tenantId);
        boolean needTransfer = referenceCountMap.values().stream()
                .anyMatch(count -> count != null && count > 0);

        if (needTransfer) {
            Long transferCategoryId = requireTransferCategory(
                    request.getTransferCategoryId(),
                    tenantId,
                    categoryIds
            );
            assetDeviceMapper.update(
                    null,
                    new LambdaUpdateWrapper<AssetDevice>()
                            .eq(AssetDevice::getTenantId, tenantId)
                            .eq(AssetDevice::getDeleted, 0)
                            .in(AssetDevice::getCategoryId, categoryIds)
                            .set(AssetDevice::getCategoryId, transferCategoryId)
            );
        }

        assetCategoryMapper.deleteBatchIds(categoryIds);
    }

    /**
     * 获取当前登录用户的租户 ID。
     *
     * @return 当前租户 ID
     */
    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null
                || currentUser.getTenantId() <= 0) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED.value(),
                    "当前登录用户未绑定租户"
            );
        }
        return currentUser.getTenantId();
    }

    /**
     * 查询并校验当前租户下的分类。
     *
     * @param id       分类 ID
     * @param tenantId 当前租户 ID
     * @return 分类实体
     */
    private AssetCategory requireCategory(Long id, Long tenantId) {
        AssetCategory entity = assetCategoryMapper.selectById(id);
        if (entity == null || !Objects.equals(entity.getTenantId(), tenantId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "设备分类不存在");
        }
        return entity;
    }

    /**
     * 查询并校验当前租户下的全部待删除分类。
     *
     * @param ids      待删除分类 ID 列表
     * @param tenantId 当前租户 ID
     * @return 当前租户下的分类实体列表
     */
    private List<AssetCategory> requireCategories(List<Long> ids, Long tenantId) {
        List<AssetCategory> categories = assetCategoryMapper.selectList(
                new LambdaQueryWrapper<AssetCategory>()
                        .eq(AssetCategory::getTenantId, tenantId)
                        .in(AssetCategory::getId, ids)
                        .orderByAsc(AssetCategory::getSort)
                        .orderByAsc(AssetCategory::getId)
        );
        if (categories.size() != ids.size()) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "待删除分类不存在");
        }
        return categories;
    }

    /**
     * 标准化分类 ID 列表，统一去重并保持原有顺序。
     *
     * @param ids 原始分类 ID 列表
     * @return 标准化后的分类 ID 列表
     */
    private List<Long> normalizeCategoryIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "待删除分类不能为空");
        }
        Set<Long> categoryIdSet = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null || id <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "分类 ID 不合法");
            }
            categoryIdSet.add(id);
        }
        return List.copyOf(categoryIdSet);
    }

    /**
     * 统计分类被设备引用的数量。
     *
     * @param ids      分类 ID 列表
     * @param tenantId 当前租户 ID
     * @return 分类 ID 到引用数量的映射
     */
    private Map<Long, Long> countDeviceReferences(List<Long> ids, Long tenantId) {
        return assetDeviceMapper.selectList(
                        new LambdaQueryWrapper<AssetDevice>()
                                .eq(AssetDevice::getTenantId, tenantId)
                                .eq(AssetDevice::getDeleted, 0)
                                .in(AssetDevice::getCategoryId, ids)
                )
                .stream()
                .collect(Collectors.groupingBy(
                        AssetDevice::getCategoryId,
                        Collectors.counting()
                ));
    }

    /**
     * 构造迁移目标分类下拉，排除本次待删除的分类。
     *
     * @param tenantId 当前租户 ID
     * @param excludedIds 需要排除的分类 ID 列表
     * @return 迁移目标下拉选项
     */
    private List<AssetOptionVo> buildTransferOptions(Long tenantId, List<Long> excludedIds) {
        return assetCategoryMapper.selectList(
                        new LambdaQueryWrapper<AssetCategory>()
                                .eq(AssetCategory::getTenantId, tenantId)
                                .notIn(AssetCategory::getId, excludedIds)
                                .orderByAsc(AssetCategory::getSort)
                                .orderByAsc(AssetCategory::getId)
                )
                .stream()
                .map(item -> AssetOptionVo.builder()
                        .value(item.getId())
                        .label(item.getName())
                        .build())
                .toList();
    }

    /**
     * 校验并返回迁移目标分类 ID。
     *
     * @param transferCategoryId 迁移目标分类 ID
     * @param tenantId 当前租户 ID
     * @param deletingIds 本次待删除分类 ID 列表
     * @return 合法迁移目标分类 ID
     */
    private Long requireTransferCategory(Long transferCategoryId,
                                         Long tenantId,
                                         List<Long> deletingIds) {
        if (transferCategoryId == null || transferCategoryId <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在设备引用时必须选择迁移目标分类");
        }
        if (deletingIds.contains(transferCategoryId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "迁移目标分类不能包含在待删除分类中");
        }
        AssetCategory transferCategory = requireCategory(transferCategoryId, tenantId);
        return transferCategory.getId();
    }

    /**
     * 校验同一租户下分类名称唯一。
     *
     * @param tenantId  当前租户 ID
     * @param name      分类名称
     * @param excludeId 编辑时排除的当前记录 ID
     */
    private void validateNameUnique(Long tenantId, String name, Long excludeId) {
        LambdaQueryWrapper<AssetCategory> queryWrapper = new LambdaQueryWrapper<AssetCategory>()
                .eq(AssetCategory::getTenantId, tenantId)
                .eq(AssetCategory::getName, name);
        if (excludeId != null) {
            queryWrapper.ne(AssetCategory::getId, excludeId);
        }
        Long count = assetCategoryMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "同一租户下分类名称不能重复"
            );
        }
    }

    /**
     * 标准化必填文本，统一处理空白和长度限制。
     *
     * @param value        原始值
     * @param blankMessage 空白错误提示
     * @param maxLength    最大长度
     * @return 标准化后的文本
     */
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

    /**
     * 标准化选填文本，避免前端传空白字符串造成展示不一致。
     *
     * @param value     原始值
     * @param maxLength 最大长度
     * @return 标准化后的文本
     */
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

    /**
     * 解析排序值，未传时按默认排序落库。
     *
     * @param sort 原始排序值
     * @return 有效排序值
     */
    private Integer resolveSort(Integer sort) {
        if (sort == null) {
            return 1;
        }
        return sort;
    }

    /**
     * 解析状态值，当前分类管理只允许启用或停用。
     *
     * @param status 原始状态值
     * @return 有效状态值
     */
    private Integer resolveStatus(Integer status) {
        if (status == null) {
            return 1;
        }
        if (status != 0 && status != 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "分类状态不合法");
        }
        return status;
    }

    /**
     * 转换为前端展示对象。
     *
     * @param entity 分类实体
     * @return 分类视图对象
     */
    private AssetCategoryVo toCategoryVo(AssetCategory entity) {
        return AssetCategoryVo.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .sort(entity.getSort())
                .status(entity.getStatus())
                .remark(entity.getRemark())
                .build();
    }
}
