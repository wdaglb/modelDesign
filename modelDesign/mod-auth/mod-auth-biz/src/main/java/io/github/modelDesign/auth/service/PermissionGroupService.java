package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.domain.PermissionGroup;
import io.github.modelDesign.auth.domain.PermissionGroupResource;
import io.github.modelDesign.auth.mapper.PermissionGroupMapper;
import io.github.modelDesign.auth.mapper.PermissionGroupResourceMapper;
import io.github.modelDesign.auth.request.PermissionGroupAddRequest;
import io.github.modelDesign.auth.request.PermissionGroupListRequest;
import io.github.modelDesign.auth.request.PermissionGroupUpdateRequest;
import io.github.modelDesign.auth.request.PermissionGroupUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.PermissionGroupListItemVo;
import io.github.modelDesign.auth.response.PermissionGroupResourceVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 权限资源组服务。
 */
@Service
public class PermissionGroupService extends ServiceImpl<PermissionGroupMapper, PermissionGroup>
        implements IService<PermissionGroup> {
    /**
     * 资源组资源关系 Mapper。
     */
    private final PermissionGroupResourceMapper permissionGroupResourceMapper;

    /**
     * 权限资源校验器。
     */
    private final PermissionResourceValidator permissionResourceValidator;

    public PermissionGroupService(PermissionGroupResourceMapper permissionGroupResourceMapper,
                                  PermissionResourceValidator permissionResourceValidator) {
        this.permissionGroupResourceMapper = permissionGroupResourceMapper;
        this.permissionResourceValidator = permissionResourceValidator;
    }

    /**
     * 供测试替身复用的最小构造函数。
     */
    protected PermissionGroupService() {
        this.permissionGroupResourceMapper = null;
        this.permissionResourceValidator = null;
    }

    /**
     * 获取资源组分页列表。
     *
     * @param request 列表请求
     * @return 分页列表
     */
    public PageResponse<PermissionGroupListItemVo> getList(PermissionGroupListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String name = normalizeKeyword(request.getName());
        String code = normalizeKeyword(request.getCode());

        List<PermissionGroup> allGroups = lambdaQuery()
                .like(StringUtils.hasText(name), PermissionGroup::getName, name)
                .like(StringUtils.hasText(code), PermissionGroup::getCode, code)
                .orderByAsc(PermissionGroup::getSort)
                .orderByDesc(PermissionGroup::getUpdateTime)
                .list();
        long total = allGroups.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<PermissionGroup> pageGroups = allGroups.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(pageGroups.stream().map(this::toListItem).toList(), total);
    }

    /**
     * 新增资源组。
     *
     * @param request 新增请求
     * @return 资源组列表项
     */
    public PermissionGroupListItemVo add(PermissionGroupAddRequest request) {
        validateCode(request.getCode(), null);
        PermissionGroup group = new PermissionGroup();
        group.setName(request.getName().trim());
        group.setCode(request.getCode().trim());
        group.setRemark(normalizeRemark(request.getRemark()));
        group.setSort(resolveSort(request.getSort()));
        group.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
        save(group);
        return toListItem(group);
    }

    /**
     * 编辑资源组。
     *
     * @param id 资源组 ID
     * @param request 编辑请求
     * @return 资源组列表项
     */
    public PermissionGroupListItemVo update(Long id, PermissionGroupUpdateRequest request) {
        PermissionGroup group = requireGroup(id);
        validateCode(request.getCode(), id);
        group.setName(request.getName().trim());
        group.setCode(request.getCode().trim());
        group.setRemark(normalizeRemark(request.getRemark()));
        group.setSort(resolveSort(request.getSort()));
        group.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
        updateById(group);
        return toListItem(group);
    }

    /**
     * 更新资源组状态。
     *
     * @param request 状态请求
     */
    public void updateStatus(PermissionGroupUpdateStatusRequest request) {
        PermissionGroup group = requireGroup(request.getId());
        group.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
        updateById(group);
    }

    /**
     * 获取资源组已配置资源。
     *
     * @param groupCode 资源组编码
     * @return 资源信息
     */
    public PermissionGroupResourceVo getResources(String groupCode) {
        PermissionGroup group = requireGroupByCode(groupCode);
        return PermissionGroupResourceVo.builder()
                .groupCode(group.getCode())
                .resources(loadResourcesByGroupCode(group.getCode()))
                .build();
    }

    /**
     * 更新资源组资源集合。
     *
     * @param groupCode 资源组编码
     * @param resources 资源集合
     */
    @Transactional
    public void updateResources(String groupCode, List<String> resources) {
        PermissionGroup group = requireGroupByCode(groupCode);
        List<String> normalizedResources = permissionResourceValidator.normalizeResourceNames(
                resources,
                PermissionResource.PLATFORM_TENANT_ID
        );

        permissionGroupResourceMapper.delete(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(PermissionGroupResource.class)
                        .eq(PermissionGroupResource::getGroupId, group.getId())
        );
        if (normalizedResources.isEmpty()) {
            return;
        }

        List<PermissionGroupResource> entities = new ArrayList<>(normalizedResources.size());
        for (String resource : normalizedResources) {
            PermissionGroupResource entity = new PermissionGroupResource();
            entity.setGroupId(group.getId());
            entity.setResource(resource);
            entities.add(entity);
        }
        saveGroupResources(entities);
    }

    /**
     * 校验资源组编码集合并返回已启用资源组映射。
     *
     * @param groupCodes 资源组编码集合
     * @return 资源组映射
     */
    public Map<String, PermissionGroup> getEnabledGroupMap(Collection<String> groupCodes) {
        Set<String> normalizedGroupCodes = normalizeGroupCodes(groupCodes);
        if (normalizedGroupCodes.isEmpty()) {
            return Map.of();
        }

        List<PermissionGroup> groups = lambdaQuery()
                .in(PermissionGroup::getCode, normalizedGroupCodes)
                .eq(PermissionGroup::getStatus, 1)
                .list();
        Map<String, PermissionGroup> groupMap = new LinkedHashMap<>();
        for (PermissionGroup group : groups) {
            groupMap.put(group.getCode(), group);
        }
        if (groupMap.size() != normalizedGroupCodes.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在无效或已禁用的权限资源组");
        }
        return groupMap;
    }

    /**
     * 批量获取资源组的资源集合。
     *
     * @param groupCodes 资源组编码集合
     * @return 资源组编码到资源列表的映射
     */
    public Map<String, List<String>> getResourceMapByGroupCodes(Collection<String> groupCodes) {
        Set<String> normalizedGroupCodes = normalizeGroupCodes(groupCodes);
        if (normalizedGroupCodes.isEmpty()) {
            return Map.of();
        }

        Map<String, PermissionGroup> groupMap = getEnabledGroupMap(normalizedGroupCodes);
        Set<Long> groupIds = new LinkedHashSet<>();
        for (PermissionGroup group : groupMap.values()) {
            groupIds.add(group.getId());
        }
        List<PermissionGroupResource> groupResources = permissionGroupResourceMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(PermissionGroupResource.class)
                        .in(PermissionGroupResource::getGroupId, groupIds)
        );
        Map<Long, String> idToCodeMap = new LinkedHashMap<>();
        for (PermissionGroup group : groupMap.values()) {
            idToCodeMap.put(group.getId(), group.getCode());
        }
        Map<String, List<String>> resourceMap = new LinkedHashMap<>();
        for (String groupCode : normalizedGroupCodes) {
            resourceMap.put(groupCode, new ArrayList<>());
        }
        for (PermissionGroupResource groupResource : groupResources) {
            String groupCode = idToCodeMap.get(groupResource.getGroupId());
            if (!StringUtils.hasText(groupCode)) {
                continue;
            }
            resourceMap.get(groupCode).add(groupResource.getResource());
        }
        return resourceMap;
    }

    /**
     * 获取资源组编码集合中的所有资源并去重。
     *
     * @param groupCodes 资源组编码集合
     * @return 展开后的资源集合
     */
    public Set<String> collectResourcesByGroupCodes(Collection<String> groupCodes) {
        Set<String> normalizedGroupCodes = normalizeGroupCodes(groupCodes);
        if (normalizedGroupCodes.isEmpty()) {
            return Set.of();
        }

        List<PermissionGroup> groups = lambdaQuery()
                .in(PermissionGroup::getCode, normalizedGroupCodes)
                .eq(PermissionGroup::getStatus, 1)
                .list();
        if (groups.isEmpty()) {
            return Set.of();
        }

        Set<Long> groupIds = new LinkedHashSet<>();
        for (PermissionGroup group : groups) {
            groupIds.add(group.getId());
        }
        List<PermissionGroupResource> groupResources = permissionGroupResourceMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(PermissionGroupResource.class)
                        .in(PermissionGroupResource::getGroupId, groupIds)
        );
        Set<String> resources = new LinkedHashSet<>();
        for (PermissionGroupResource groupResource : groupResources) {
            resources.add(groupResource.getResource());
        }
        return resources;
    }

    /**
     * 规范化资源组编码列表。
     *
     * @param groupCodes 原始编码列表
     * @return 规范化结果
     */
    public Set<String> normalizeGroupCodes(Collection<String> groupCodes) {
        if (groupCodes == null || groupCodes.isEmpty()) {
            return Set.of();
        }
        Set<String> normalizedGroupCodes = new LinkedHashSet<>();
        for (String groupCode : groupCodes) {
            if (!StringUtils.hasText(groupCode)) {
                continue;
            }
            normalizedGroupCodes.add(groupCode.trim());
        }
        return normalizedGroupCodes;
    }

    /**
     * 根据资源组 ID 获取资源组。
     */
    public PermissionGroup requireGroup(Long id) {
        PermissionGroup group = getById(id);
        if (group == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "权限资源组不存在");
        }
        return group;
    }

    /**
     * 根据资源组编码获取资源组。
     */
    public PermissionGroup requireGroupByCode(String code) {
        PermissionGroup group = lambdaQuery()
                .eq(PermissionGroup::getCode, code)
                .last("limit 1")
                .one();
        if (group == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "权限资源组不存在");
        }
        return group;
    }

    private List<String> loadResourcesByGroupCode(String groupCode) {
        PermissionGroup group = requireGroupByCode(groupCode);
        List<PermissionGroupResource> groupResources = permissionGroupResourceMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(PermissionGroupResource.class)
                        .eq(PermissionGroupResource::getGroupId, group.getId())
                        .orderByAsc(PermissionGroupResource::getId)
        );
        List<String> resources = new ArrayList<>(groupResources.size());
        for (PermissionGroupResource groupResource : groupResources) {
            resources.add(groupResource.getResource());
        }
        return resources;
    }

    private void saveGroupResources(List<PermissionGroupResource> entities) {
        for (PermissionGroupResource entity : entities) {
            permissionGroupResourceMapper.insert(entity);
        }
    }

    private void validateCode(String code, Long currentId) {
        String normalizedCode = normalizeKeyword(code);
        if (!StringUtils.hasText(normalizedCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "资源组编码不能为空");
        }
        boolean exists = lambdaQuery()
                .eq(PermissionGroup::getCode, normalizedCode)
                .ne(currentId != null, PermissionGroup::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "资源组编码已存在");
        }
    }

    private String normalizeKeyword(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String normalizeRemark(String remark) {
        if (!StringUtils.hasText(remark)) {
            return "";
        }
        return remark.trim();
    }

    private Integer resolveSort(Integer sort) {
        if (sort == null) {
            return 0;
        }
        return sort;
    }

    private PermissionGroupListItemVo toListItem(PermissionGroup group) {
        return PermissionGroupListItemVo.builder()
                .id(group.getId())
                .name(group.getName())
                .code(group.getCode())
                .remark(group.getRemark())
                .sort(group.getSort())
                .isDisable(!Objects.equals(group.getStatus(), 1))
                .build();
    }
}
