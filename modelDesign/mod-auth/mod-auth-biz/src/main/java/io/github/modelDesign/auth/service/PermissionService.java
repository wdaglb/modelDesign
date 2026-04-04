package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.constant.PermissionType;
import io.github.modelDesign.auth.response.CurrentPermissionVo;
import io.github.modelDesign.auth.response.RolePermissionVo;
import lombok.RequiredArgsConstructor;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 权限服务。
 */
@Service
@RequiredArgsConstructor
public class PermissionService {
    /**
     * 菜单服务。
     */
    private final MenuService menuService;

    /**
     * Casbin 执行器。
     */
    private final Enforcer enforcer;

    /**
     * 获取当前用户菜单。
     *
     * @return 菜单响应
     */
    public CurrentPermissionVo getCurrentPermission() {
        List<CurrentPermissionVo.MenuItemVo> menus = menuService.listEnabledMenuNodes()
                .stream()
                .map(item -> CurrentPermissionVo.MenuItemVo.builder()
                        .id(item.getId())
                        .parentId(item.getParentId())
                        .name(item.getName())
                        .title(item.getTitle())
                        .iconType(item.getIconType())
                        .iconValue(item.getIconValue())
                        .build())
                .toList();
        return CurrentPermissionVo.builder()
                .menus(menus)
                .build();
    }

    /**
     * 赋予角色权限。
     *
     * @param role 角色编码
     * @param type 权限类型，例如：menu、api
     * @param obj  权限对象，例如：/system/role
     * @return 是否成功
     */
    public boolean grantPermission(String role, String type, String obj) {
        return enforcer.addPolicy(role, type, obj);
    }

    /**
     * 撤销角色权限。
     *
     * @param role 角色编码
     * @param type 权限类型，例如：menu、api
     * @param obj  权限对象，例如：/system/role
     * @return 是否成功
     */
    public boolean revokePermission(String role, String type, String obj) {
        return enforcer.removePolicy(role, type, obj);
    }

    /**
     * 检查用户或角色是否拥有权限。
     *
     * @param sub  用户或角色
     * @param type 权限类型，例如：menu、api
     * @param obj  权限对象，例如：/system/role
     * @return 是否拥有权限
     */
    public boolean hasPermission(String sub, String type, String obj) {
        return enforcer.enforce(sub, type, obj);
    }

    /**
     * 获取角色拥有的所有权限。
     *
     * @param role 角色编码
     * @return 权限策略列表，每条策略为 [type, obj]
     */
    public java.util.List<java.util.List<String>> getPermissionsForRole(String role) {
        return enforcer.getFilteredPolicy(0, role)
                .stream()
                .map(p -> p.subList(1, p.size()))
                .toList();
    }

    /**
     * 查询角色的权限信息。
     *
     * @param roleCode 角色编码
     * @return 角色权限 VO
     */
    public RolePermissionVo getRolePermission(String roleCode) {
        // 查询 type=menu 的所有策略，取 obj 字段
        List<String> menus = enforcer.getFilteredPolicy(0, roleCode, PermissionType.MENU)
                .stream()
                .map(p -> p.get(2))
                .toList();
        return RolePermissionVo.builder()
                .menus(menus)
                .build();
    }

    /**
     * 批量更新角色的菜单权限。
     * <p>
     * 采用先删后增策略：先移除该角色所有 type=menu 的策略，再批量添加新策略。
     * 即使传入空列表，也会清空该角色的全部菜单权限。
     *
     * @param roleCode 角色编码
     * @param menus    新的菜单权限路径列表，传空则清空所有菜单权限
     */
    @Transactional
    public void updateRoleMenuPermissions(String roleCode, List<String> menus) {
        // 查出该角色当前所有菜单权限策略，逐条调用 removePolicy 删除
        List<List<String>> existing = enforcer.getFilteredPolicy(0, roleCode, PermissionType.MENU);
        for (List<String> policy : existing) {
            // policy 格式为 [sub, type, obj]，removePolicy 需要相同格式
            enforcer.removePolicy(policy.get(0), policy.get(1), policy.get(2));
        }
        // 批量添加新策略
        if (menus != null && !menus.isEmpty()) {
            List<List<String>> policies = menus.stream()
                    .map(obj -> List.of(roleCode, PermissionType.MENU, obj))
                    .toList();
            enforcer.addPolicies(policies);
        }
    }

    /**
     * 获取用户已绑定的角色编码列表。
     *
     * @param userId 用户 ID（字符串形式）
     * @return 角色编码列表
     */
    public List<String> getUserRoles(String userId) {
        return enforcer.getRolesForUser(userId);
    }

    /**
     * 批量获取用户绑定的角色编码列表。
     *
     * @param userIds 用户 ID 集合
     * @return 用户 ID 到角色编码列表的映射
     */
    public Map<Long, List<String>> getUserRoleCodesMap(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> distinctUserIds = new LinkedHashSet<>();
        for (Long userId : userIds) {
            if (userId != null) {
                distinctUserIds.add(userId);
            }
        }
        if (distinctUserIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, List<String>> userRoleMap = new LinkedHashMap<>();
        for (Long userId : distinctUserIds) {
            List<String> roles = enforcer.getRolesForUser(String.valueOf(userId));
            List<String> normalizedRoles = new ArrayList<>();
            if (roles != null && !roles.isEmpty()) {
                for (String role : roles) {
                    if (role == null) {
                        continue;
                    }
                    String trimmedRole = role.trim();
                    if (!trimmedRole.isEmpty()) {
                        normalizedRoles.add(trimmedRole);
                    }
                }
            }
            userRoleMap.put(userId, normalizedRoles);
        }
        return userRoleMap;
    }

    /**
     * 更新用户绑定角色（先解绑全部，再重新绑定）。
     *
     * @param userId    用户 ID（字符串形式）
     * @param roleCodes 新的角色编码列表，传空则清空所有角色绑定
     */
    @Transactional
    public void updateUserRoles(String userId, List<String> roleCodes) {
        // 先删除该用户的所有角色绑定
        enforcer.deleteRolesForUser(userId);
        // 再批量添加新绑定
        if (roleCodes != null && !roleCodes.isEmpty()) {
            for (String roleCode : roleCodes) {
                if (roleCode == null || roleCode.isBlank()) {
                    continue;
                }
                enforcer.addRoleForUser(userId, roleCode.trim());
            }
        }
    }

    /**
     * 获取角色下绑定的用户 ID 列表。
     *
     * @param roleCode 角色编码
     * @return 用户 ID 列表（Long 类型）
     */
    public List<Long> getRoleUsers(String roleCode) {
        return enforcer.getUsersForRole(roleCode)
                .stream()
                .map(s -> {
                    try {
                        return Long.parseLong(s);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(id -> id != null)
                .collect(Collectors.toList());
    }

    /**
     * 更新角色绑定用户（先解绑全部，再重新绑定）。
     *
     * @param roleCode 角色编码
     * @param userIds  新的用户 ID 列表，传空则清空所有用户绑定
     */
    @Transactional
    public void updateRoleUsers(String roleCode, List<Long> userIds) {
        // 先删除该角色下所有用户绑定
        List<String> existingUsers = enforcer.getUsersForRole(roleCode);
        for (String userId : existingUsers) {
            enforcer.deleteRoleForUser(userId, roleCode);
        }
        // 再批量添加新绑定
        if (userIds != null && !userIds.isEmpty()) {
            for (Long userId : userIds) {
                enforcer.addRoleForUser(String.valueOf(userId), roleCode);
            }
        }
    }
}
