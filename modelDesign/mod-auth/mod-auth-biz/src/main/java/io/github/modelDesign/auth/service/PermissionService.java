package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.constant.PermissionType;
import io.github.modelDesign.auth.domain.Menu;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import io.github.modelDesign.auth.mapper.UserMapper;
import io.github.modelDesign.auth.response.CurrentPermissionVo;
import io.github.modelDesign.auth.response.RolePermissionVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 权限服务。
 *
 * 当前实现完成三件事：
 * 1. 以租户域为边界维护 Casbin 中的用户-角色、角色-资源关系。
 * 2. 统一把菜单和按钮都视为菜单树上的“资源节点”做授权。
 * 3. 为当前登录用户输出可见菜单与可用按钮，供前后端同时消费。
 */
@Service
public class PermissionService {
    /**
     * 菜单服务。
     */
    private final MenuService menuService;

    /**
     * 角色服务。
     */
    private final RoleService roleService;

    /**
     * 用户 Mapper。
     */
    private final UserMapper userMapper;

    /**
     * 当前登录上下文访问器。
     */
    private final CurrentAdminAccessor currentAdminAccessor;

    /**
     * Casbin 执行器。
     */
    private final Enforcer enforcer;

    /**
     * 运行时依赖构造函数。
     *
     * @param menuService 菜单服务
     * @param roleService 角色服务
     * @param userMapper 用户 Mapper
     * @param currentAdminAccessor 当前登录上下文访问器
     * @param enforcer Casbin 执行器
     */
    @Autowired
    public PermissionService(MenuService menuService,
                             RoleService roleService,
                             UserMapper userMapper,
                             CurrentAdminAccessor currentAdminAccessor,
                             Enforcer enforcer) {
        this.menuService = menuService;
        this.roleService = roleService;
        this.userMapper = userMapper;
        this.currentAdminAccessor = currentAdminAccessor;
        this.enforcer = enforcer;
    }

    /**
     * 兼容既有测试替身的精简构造函数。
     *
     * @param menuService 菜单服务
     * @param enforcer Casbin 执行器
     */
    public PermissionService(MenuService menuService, Enforcer enforcer) {
        this.menuService = menuService;
        this.roleService = null;
        this.userMapper = null;
        this.currentAdminAccessor = null;
        this.enforcer = enforcer;
    }

    /**
     * 获取当前登录用户权限。
     *
     * 这里会先按“当前用户 + 当前租户域”计算资源集合，
     * 再根据菜单节点类型分别拆成侧边导航菜单和页面按钮权限。
     *
     * @return 当前登录用户权限
     */
    public CurrentPermissionVo getCurrentPermission() {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        Long currentUserId = currentAdminAccessor.requireCurrentUserId();
        if (currentAdminAccessor.isSuperAdmin()) {
            return buildCurrentPermission(menuService.listAllMenus());
        }
        Set<String> resourceNames = getUserGrantedResourceNames(
                String.valueOf(currentUserId),
                currentTenantId
        );

        if (resourceNames.isEmpty()) {
            return CurrentPermissionVo.builder()
                    .menus(List.of())
                    .buttons(List.of())
                    .build();
        }

        return buildCurrentPermission(menuService.listEnabledNodesByNames(resourceNames));
    }

    /**
     * 判断当前登录用户是否拥有指定权限。
     *
     * @param type 权限类型
     * @param obj 资源标识
     * @return 是否拥有权限
     */
    public boolean hasCurrentUserPermission(String type, String obj) {
        if (!StringUtils.hasText(type)) {
            return false;
        }
        if (!StringUtils.hasText(obj)) {
            return false;
        }

        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        if (currentAdminAccessor.isSuperAdmin()) {
            return true;
        }
        if (!PermissionResource.isResourceAssignable(currentTenantId, obj)) {
            return false;
        }

        Long currentUserId = currentAdminAccessor.requireCurrentUserId();
        return hasPermission(
                String.valueOf(currentUserId),
                toDomain(currentTenantId),
                type,
                obj
        );
    }

    /**
     * 检查主体在指定租户域下是否拥有权限。
     *
     * @param sub 主体
     * @param domain 租户域
     * @param type 权限类型
     * @param obj 资源标识
     * @return 是否拥有权限
     */
    public boolean hasPermission(String sub, String domain, String type, String obj) {
        return enforcer.enforce(sub, domain, type, obj);
    }

    /**
     * 兼容当前租户域下的旧调用。
     *
     * @param sub 主体
     * @param type 权限类型
     * @param obj 资源标识
     * @return 是否拥有权限
     */
    public boolean hasPermission(String sub, String type, String obj) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        return hasPermission(sub, toDomain(currentTenantId), type, obj);
    }

    /**
     * 获取角色拥有的资源策略。
     *
     * @param roleCode 角色编码
     * @return 资源策略列表
     */
    public List<List<String>> getPermissionsForRole(String roleCode) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        return enforcer.getFilteredPolicy(0, roleCode, toDomain(currentTenantId))
                .stream()
                .map(policy -> policy.subList(1, policy.size()))
                .toList();
    }

    /**
     * 查询角色权限配置。
     *
     * @param roleCode 角色编码
     * @return 角色权限 VO
     */
    public RolePermissionVo getRolePermission(String roleCode) {
        roleService.requireRoleByCode(roleCode);
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<String> resources = loadResourceNamesByRole(roleCode, currentTenantId);
        return RolePermissionVo.builder()
                .menus(resources)
                .build();
    }

    /**
     * 批量更新角色的菜单/按钮权限。
     *
     * @param roleCode 角色编码
     * @param menus 菜单/按钮资源路径列表
     */
    @Transactional
    public void updateRoleMenuPermissions(String roleCode, List<String> menus) {
        roleService.requireRoleByCode(roleCode);
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<String> normalizedResources = normalizeResourceNames(menus, currentTenantId);

        enforcer.removeFilteredPolicy(0, roleCode, toDomain(currentTenantId), PermissionType.MENU);

        if (normalizedResources.isEmpty()) {
            return;
        }

        List<List<String>> policies = new ArrayList<>();
        for (String resource : normalizedResources) {
            policies.add(List.of(
                    roleCode,
                    toDomain(currentTenantId),
                    PermissionType.MENU,
                    resource
            ));
        }
        enforcer.addPolicies(policies);
    }

    /**
     * 获取用户在当前租户下绑定的角色编码列表。
     *
     * @param userId 用户 ID
     * @return 角色编码列表
     */
    public List<String> getUserRoles(String userId) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        return loadRoleCodesForUser(userId, currentTenantId);
    }

    /**
     * 批量获取用户在当前租户下绑定的角色编码列表。
     *
     * @param userIds 用户 ID 集合
     * @return 用户 ID 到角色编码列表的映射
     */
    public Map<Long, List<String>> getUserRoleCodesMap(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
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
            userRoleMap.put(
                    userId,
                    loadRoleCodesForUser(String.valueOf(userId), currentTenantId)
            );
        }
        return userRoleMap;
    }

    /**
     * 更新用户在当前租户下绑定的角色。
     *
     * @param userId 用户 ID
     * @param roleCodes 角色编码列表
     */
    @Transactional
    public void updateUserRoles(String userId, List<String> roleCodes) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        validateUserAccessible(userId, currentTenantId);
        List<String> normalizedRoleCodes = normalizeRoleCodes(roleCodes);

        List<List<String>> existingPolicies = enforcer.getFilteredGroupingPolicy(
                0,
                userId,
                "",
                toDomain(currentTenantId)
        );
        for (List<String> policy : existingPolicies) {
            enforcer.removeGroupingPolicy(policy);
        }

        for (String roleCode : normalizedRoleCodes) {
            roleService.requireRoleByCode(roleCode);
            enforcer.addRoleForUserInDomain(
                    userId,
                    roleCode,
                    toDomain(currentTenantId)
            );
        }
    }

    /**
     * 获取当前租户下角色已绑定的用户 ID 列表。
     *
     * @param roleCode 角色编码
     * @return 用户 ID 列表
     */
    public List<Long> getRoleUsers(String roleCode) {
        roleService.requireRoleByCode(roleCode);
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<String> userIds = enforcer.getUsersForRoleInDomain(
                roleCode,
                toDomain(currentTenantId)
        );

        List<Long> result = new ArrayList<>();
        for (String userId : userIds) {
            if (!StringUtils.hasText(userId)) {
                continue;
            }
            try {
                result.add(Long.parseLong(userId));
            } catch (NumberFormatException ignored) {
                /**
                 * Casbin 中若混入了非数字主体，说明数据已脱离当前用户主体约定。
                 * 这里直接跳过异常数据，避免列表接口被单条脏数据拖垮。
                 */
            }
        }
        return result;
    }

    /**
     * 更新当前租户下角色绑定的用户。
     *
     * @param roleCode 角色编码
     * @param userIds 用户 ID 列表
     */
    @Transactional
    public void updateRoleUsers(String roleCode, List<Long> userIds) {
        roleService.requireRoleByCode(roleCode);
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<Long> normalizedUserIds = normalizeUserIds(userIds);

        List<String> existingUsers = enforcer.getUsersForRoleInDomain(
                roleCode,
                toDomain(currentTenantId)
        );
        for (String userId : existingUsers) {
            enforcer.deleteRoleForUserInDomain(
                    userId,
                    roleCode,
                    toDomain(currentTenantId)
            );
        }

        for (Long userId : normalizedUserIds) {
            validateUserAccessible(String.valueOf(userId), currentTenantId);
            enforcer.addRoleForUserInDomain(
                    String.valueOf(userId),
                    roleCode,
                    toDomain(currentTenantId)
            );
        }
    }

    /**
     * 计算用户在当前租户下拥有的资源集合。
     *
     * @param userId 用户 ID
     * @param tenantId 租户 ID
     * @return 资源集合
     */
    private Set<String> getUserGrantedResourceNames(String userId, Long tenantId) {
        List<String> roleCodes = loadRoleCodesForUser(userId, tenantId);
        if (roleCodes.isEmpty()) {
            return Set.of();
        }

        Set<String> resourceNames = new LinkedHashSet<>();
        for (String roleCode : roleCodes) {
            resourceNames.addAll(loadResourceNamesByRole(roleCode, tenantId));
        }
        return resourceNames;
    }

    /**
     * 获取角色在指定租户下绑定的资源集合。
     *
     * @param roleCode 角色编码
     * @param tenantId 租户 ID
     * @return 资源路径列表
     */
    private List<String> loadResourceNamesByRole(String roleCode, Long tenantId) {
        List<List<String>> policies = enforcer.getFilteredPolicy(
                0,
                roleCode,
                toDomain(tenantId),
                PermissionType.MENU
        );
        List<String> resources = new ArrayList<>();
        for (List<String> policy : policies) {
            if (policy.size() < 4) {
                continue;
            }
            String resource = policy.get(3);
            if (!PermissionResource.isResourceAssignable(tenantId, resource)) {
                continue;
            }
            resources.add(resource);
        }
        return resources;
    }

    /**
     * 获取用户在指定租户下绑定的角色编码。
     *
     * @param userId 用户 ID
     * @param tenantId 租户 ID
     * @return 角色编码列表
     */
    private List<String> loadRoleCodesForUser(String userId, Long tenantId) {
        List<String> roles = enforcer.getRolesForUserInDomain(
                userId,
                toDomain(tenantId)
        );
        List<String> normalizedRoles = new ArrayList<>();
        for (String roleCode : roles) {
            if (!StringUtils.hasText(roleCode)) {
                continue;
            }
            normalizedRoles.add(roleCode.trim());
        }
        return normalizedRoles;
    }

    /**
     * 校验并规范化资源列表。
     *
     * @param resourceNames 原始资源列表
     * @param tenantId 当前租户 ID
     * @return 规范化后的资源列表
     */
    private List<String> normalizeResourceNames(List<String> resourceNames, Long tenantId) {
        if (resourceNames == null || resourceNames.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<String> normalizedNames = new LinkedHashSet<>();
        for (String resourceName : resourceNames) {
            if (!StringUtils.hasText(resourceName)) {
                continue;
            }
            String normalizedResourceName = resourceName.trim();
            if (!PermissionResource.isResourceAssignable(tenantId, normalizedResourceName)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前租户不能分配平台级权限");
            }
            normalizedNames.add(normalizedResourceName);
        }
        if (normalizedNames.isEmpty()) {
            return List.of();
        }

        Set<String> existingNames = menuService.getExistingNameSet(normalizedNames);
        if (existingNames.size() != normalizedNames.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在无效的权限资源");
        }

        return new ArrayList<>(normalizedNames);
    }

    /**
     * 规范化角色编码列表。
     *
     * @param roleCodes 原始角色编码列表
     * @return 规范化后的角色编码列表
     */
    private List<String> normalizeRoleCodes(List<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return List.of();
        }
        return roleCodes.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 规范化用户 ID 列表。
     *
     * @param userIds 原始用户 ID 列表
     * @return 规范化后的用户 ID 列表
     */
    private List<Long> normalizeUserIds(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return userIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 校验用户是否属于当前租户。
     *
     * @param userId 用户 ID
     * @param currentTenantId 当前租户 ID
     */
    private void validateUserAccessible(String userId, Long currentTenantId) {
        if (!StringUtils.hasText(userId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户 ID 不能为空");
        }
        User user;
        try {
            user = userMapper.selectById(Long.parseLong(userId));
        } catch (NumberFormatException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户 ID 不合法");
        }
        if (user == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "用户不存在");
        }
        if (!currentTenantId.equals(user.getTenantId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "不能跨租户绑定角色");
        }
    }

    /**
     * 将租户 ID 转换为 Casbin 域标识。
     *
     * @param tenantId 租户 ID
     * @return Casbin 域标识
     */
    private String toDomain(Long tenantId) {
        return String.valueOf(tenantId);
    }

    /**
     * 组装当前权限返回值。
     *
     * 该方法把同一批资源节点拆成“页面菜单”和“按钮权限”两个视图，
     * 让前端既能渲染侧边导航，也能直接做按钮级显隐。
     *
     * @param menusOrButtons 菜单与按钮节点
     * @return 当前权限返回值
     */
    private CurrentPermissionVo buildCurrentPermission(List<Menu> menusOrButtons) {
        List<CurrentPermissionVo.MenuItemVo> menus = new ArrayList<>();
        List<String> buttons = new ArrayList<>();

        for (Menu menu : menusOrButtons) {
            if (MenuNodeTypeEnum.BUTTON.equals(menu.getNodeType())) {
                buttons.add(menu.getName());
                continue;
            }
            menus.add(CurrentPermissionVo.MenuItemVo.builder()
                    .id(menu.getId())
                    .parentId(menu.getParentId())
                    .name(menu.getName())
                    .title(menu.getTitle())
                    .iconType(menu.getIconType())
                    .iconValue(menu.getIconValue())
                    .build());
        }

        return CurrentPermissionVo.builder()
                .menus(menus)
                .buttons(buttons)
                .build();
    }
}
