package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.response.UserListItemVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 用户列表视图组装器。
 */
@Service
@RequiredArgsConstructor
public class UserListViewAssembler {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 租户服务。
     */
    private final TenantService tenantService;

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 用户职位关系服务。
     */
    private final UserPositionService userPositionService;

    /**
     * 角色服务。
     */
    private final RoleService roleService;

    /**
     * 职位服务。
     */
    private final PositionService positionService;

    /**
     * 批量组装用户列表视图。
     *
     * @param users 用户列表
     * @return 用户列表项
     */
    public List<UserListItemVo> assemble(List<User> users) {
        if (users == null || users.isEmpty()) {
            return Collections.emptyList();
        }
        List<User> validUsers = new ArrayList<>();
        Set<Long> userIds = new LinkedHashSet<>();
        Set<Long> tenantIds = new LinkedHashSet<>();
        for (User user : users) {
            if (user == null) {
                continue;
            }
            validUsers.add(user);
            if (user.getId() != null) {
                userIds.add(user.getId());
            }
            if (user.getTenantId() != null) {
                tenantIds.add(user.getTenantId());
            }
        }
        if (validUsers.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, String> tenantNameMap = tenantService.getDisplayNameMapByIds(tenantIds);
        Map<Long, List<String>> userRoleCodesMap = permissionService.getUserRoleCodesMap(userIds);
        Map<Long, List<Long>> userPositionIdsMap = userPositionService.getUserPositionIdsMap(userIds);
        Set<String> roleCodes = collectRoleCodes(userRoleCodesMap);
        Set<Long> positionIds = collectPositionIds(userPositionIdsMap);
        Map<String, String> roleNameMap = roleService.getNameMapByCodes(roleCodes);
        Map<Long, String> positionNameMap = positionService.getNameMapByIds(positionIds);

        List<UserListItemVo> items = new ArrayList<>();
        for (User user : validUsers) {
            items.add(toUserListItem(user, tenantNameMap, userRoleCodesMap, userPositionIdsMap,
                    roleNameMap, positionNameMap));
        }
        return items;
    }

    /**
     * 组装单个用户列表项。
     *
     * @param user 用户实体
     * @param tenantNameMap 租户名称映射
     * @param userRoleCodesMap 用户角色编码映射
     * @param userPositionIdsMap 用户职位 ID 映射
     * @param roleNameMap 角色名称映射
     * @param positionNameMap 职位名称映射
     * @return 用户列表项
     */
    private UserListItemVo toUserListItem(User user,
                                          Map<Long, String> tenantNameMap,
                                          Map<Long, List<String>> userRoleCodesMap,
                                          Map<Long, List<Long>> userPositionIdsMap,
                                          Map<String, String> roleNameMap,
                                          Map<Long, String> positionNameMap) {
        String tenantName = resolveTenantName(user.getTenantId(), tenantNameMap);
        List<String> roleCodes = resolveRoleCodes(user.getId(), userRoleCodesMap);
        List<Long> positionIds = resolvePositionIds(user.getId(), userPositionIdsMap);
        List<String> roleNames = resolveRoleNames(roleCodes, roleNameMap);
        List<String> positionNames = resolvePositionNames(positionIds, positionNameMap);

        boolean hasRole = !roleCodes.isEmpty();
        boolean hasPosition = !positionIds.isEmpty();

        return UserListItemVo.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .username(user.getUsername())
                .tenantId(user.getTenantId())
                .tenantName(tenantName)
                .avatarId(user.getAvatarId())
                .roleNames(roleNames)
                .positionNames(positionNames)
                .hasRole(hasRole)
                .hasPosition(hasPosition)
                .lastLoginTime(formatDateTime(user.getLastLoginTime()))
                .updatedAt(formatDateTime(user.getUpdateTime()))
                .isDisable(resolveDisable(user.getStatus()))
                .build();
    }

    /**
     * 汇总用户角色编码。
     *
     * @param userRoleCodesMap 用户角色编码映射
     * @return 角色编码集合
     */
    private Set<String> collectRoleCodes(Map<Long, List<String>> userRoleCodesMap) {
        if (userRoleCodesMap == null || userRoleCodesMap.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> roleCodes = new LinkedHashSet<>();
        for (List<String> codes : userRoleCodesMap.values()) {
            if (codes == null || codes.isEmpty()) {
                continue;
            }
            for (String code : codes) {
                if (StringUtils.hasText(code)) {
                    roleCodes.add(code.trim());
                }
            }
        }
        return roleCodes;
    }

    /**
     * 汇总用户职位 ID。
     *
     * @param userPositionIdsMap 用户职位 ID 映射
     * @return 职位 ID 集合
     */
    private Set<Long> collectPositionIds(Map<Long, List<Long>> userPositionIdsMap) {
        if (userPositionIdsMap == null || userPositionIdsMap.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Long> positionIds = new LinkedHashSet<>();
        for (List<Long> ids : userPositionIdsMap.values()) {
            if (ids == null || ids.isEmpty()) {
                continue;
            }
            for (Long id : ids) {
                if (id != null) {
                    positionIds.add(id);
                }
            }
        }
        return positionIds;
    }

    /**
     * 解析用户绑定的角色编码。
     *
     * @param userId 用户 ID
     * @param userRoleCodesMap 用户角色编码映射
     * @return 角色编码列表
     */
    private List<String> resolveRoleCodes(Long userId, Map<Long, List<String>> userRoleCodesMap) {
        if (userId == null || userRoleCodesMap == null) {
            return Collections.emptyList();
        }
        List<String> roleCodes = userRoleCodesMap.get(userId);
        if (roleCodes == null) {
            return Collections.emptyList();
        }
        return roleCodes;
    }

    /**
     * 解析用户绑定的职位 ID。
     *
     * @param userId 用户 ID
     * @param userPositionIdsMap 用户职位 ID 映射
     * @return 职位 ID 列表
     */
    private List<Long> resolvePositionIds(Long userId, Map<Long, List<Long>> userPositionIdsMap) {
        if (userId == null || userPositionIdsMap == null) {
            return Collections.emptyList();
        }
        List<Long> positionIds = userPositionIdsMap.get(userId);
        if (positionIds == null) {
            return Collections.emptyList();
        }
        return positionIds;
    }

    /**
     * 解析角色名称列表。
     *
     * @param roleCodes 角色编码列表
     * @param roleNameMap 角色名称映射
     * @return 角色名称列表
     */
    private List<String> resolveRoleNames(List<String> roleCodes, Map<String, String> roleNameMap) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> roleNames = new ArrayList<>();
        for (String roleCode : roleCodes) {
            if (!StringUtils.hasText(roleCode)) {
                continue;
            }
            String trimmedCode = roleCode.trim();
            String roleName = "";
            if (roleNameMap != null) {
                String mappedName = roleNameMap.get(trimmedCode);
                if (mappedName != null) {
                    roleName = mappedName;
                }
            }
            if (!StringUtils.hasText(roleName)) {
                roleName = trimmedCode;
            }
            roleNames.add(roleName);
        }
        return roleNames;
    }

    /**
     * 解析职位名称列表。
     *
     * @param positionIds 职位 ID 列表
     * @param positionNameMap 职位名称映射
     * @return 职位名称列表
     */
    private List<String> resolvePositionNames(List<Long> positionIds, Map<Long, String> positionNameMap) {
        if (positionIds == null || positionIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> positionNames = new ArrayList<>();
        for (Long positionId : positionIds) {
            if (positionId == null) {
                continue;
            }
            String positionName = "";
            if (positionNameMap != null) {
                String mappedName = positionNameMap.get(positionId);
                if (mappedName != null) {
                    positionName = mappedName;
                }
            }
            if (!StringUtils.hasText(positionName)) {
                positionName = String.valueOf(positionId);
            }
            positionNames.add(positionName);
        }
        return positionNames;
    }

    /**
     * 解析租户名称。
     *
     * @param tenantId 租户 ID
     * @param tenantNameMap 租户名称映射
     * @return 租户名称
     */
    private String resolveTenantName(Long tenantId, Map<Long, String> tenantNameMap) {
        if (tenantId == null || tenantNameMap == null) {
            return "";
        }
        String tenantName = tenantNameMap.get(tenantId);
        if (tenantName == null) {
            return "";
        }
        return tenantName;
    }

    /**
     * 解析用户禁用状态。
     *
     * @param status 数据库存储状态
     * @return 是否禁用
     */
    private Boolean resolveDisable(Integer status) {
        if (Objects.equals(status, 1)) {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    /**
     * 格式化时间。
     *
     * @param value 时间值
     * @return 格式化后的时间
     */
    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
