package io.github.modelDesign.auth.service;

import lombok.extern.slf4j.Slf4j;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.constant.PermissionType;
import io.github.modelDesign.auth.domain.Menu;
import io.github.modelDesign.auth.domain.RolePermissionGroup;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import io.github.modelDesign.auth.mapper.RolePermissionGroupMapper;
import io.github.modelDesign.auth.mapper.UserMapper;
import io.github.modelDesign.auth.response.CurrentPermissionVo;
import io.github.modelDesign.auth.response.RolePermissionVo;
import io.github.modelDesign.auth.util.PermissionPathMatcher;
import io.github.modelDesign.common.exception.BusinessException;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
 * 当前实现完成四件事：
 * 1. 以租户域为边界维护 Casbin 中的用户-角色、角色-资源关系。
 * 2. 支持角色同时直绑资源与绑定权限资源组。
 * 3. 统一按通配符规则计算接口鉴权、菜单回显与按钮显隐。
 * 4. 为当前登录用户输出可见菜单与可用按钮，供前后端同时消费。
 */
@Service
@Slf4j
public class PermissionService {
    /**
     * Casbin 用户主体前缀。
     */
    private static final String USER_SUBJECT_PREFIX = "user:";

    /**
     * Casbin 角色主体前缀。
     */
    private static final String ROLE_SUBJECT_PREFIX = "role:";

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
     * 权限资源组服务。
     */
    private final PermissionGroupService permissionGroupService;

    /**
     * 角色-资源组关系 Mapper。
     */
    private final RolePermissionGroupMapper rolePermissionGroupMapper;

    /**
     * 权限资源校验器。
     */
    private final PermissionResourceValidator permissionResourceValidator;

    /**
     * 权限资源目录服务。
     */
    private final PermissionResourceCatalogService permissionResourceCatalogService;

    /**
     * 运行时依赖构造函数。
     *
     * @param menuService 菜单服务
     * @param roleService 角色服务
     * @param userMapper 用户 Mapper
     * @param currentAdminAccessor 当前登录上下文访问器
     * @param enforcer Casbin 执行器
     * @param permissionGroupService 权限资源组服务
     * @param rolePermissionGroupMapper 角色-资源组关系 Mapper
     * @param permissionResourceValidator 权限资源校验器
     */
    @Autowired
    public PermissionService(MenuService menuService,
                             RoleService roleService,
                             UserMapper userMapper,
                             CurrentAdminAccessor currentAdminAccessor,
                             Enforcer enforcer,
                             PermissionGroupService permissionGroupService,
                             RolePermissionGroupMapper rolePermissionGroupMapper,
                             PermissionResourceValidator permissionResourceValidator,
                             PermissionResourceCatalogService permissionResourceCatalogService) {
        this.menuService = menuService;
        this.roleService = roleService;
        this.userMapper = userMapper;
        this.currentAdminAccessor = currentAdminAccessor;
        this.enforcer = enforcer;
        this.permissionGroupService = permissionGroupService;
        this.rolePermissionGroupMapper = rolePermissionGroupMapper;
        this.permissionResourceValidator = permissionResourceValidator;
        this.permissionResourceCatalogService = permissionResourceCatalogService;
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
        this.permissionGroupService = null;
        this.rolePermissionGroupMapper = null;
        this.permissionResourceValidator = null;
        this.permissionResourceCatalogService = null;
    }

    /**
     * 获取当前登录用户权限。
     *
     * 这里会先按“当前用户 + 当前租户域”计算最终资源集合，
     * 再根据菜单节点类型分别拆成侧边导航菜单和页面按钮权限。
     *
     * @return 当前登录用户权限
     */
    public CurrentPermissionVo getCurrentPermission() {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        Long currentUserId = currentAdminAccessor.requireCurrentUserId();
        if (currentAdminAccessor.isSuperAdmin()) {
            return buildSuperAdminCurrentPermission(currentTenantId);
        }

        Set<String> menuResources = getUserGrantedResourceNames(
                String.valueOf(currentUserId),
                currentTenantId,
                PermissionType.MENU
        );
        Set<String> apiResources = getUserGrantedResourceNames(
                String.valueOf(currentUserId),
                currentTenantId,
                PermissionType.API
        );
        if (menuResources.isEmpty() && apiResources.isEmpty()) {
            return CurrentPermissionVo.builder()
                    .menus(List.of())
                    .permissions(List.of())
                    .build();
        }
        return buildCurrentPermission(menuResources, apiResources);
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
     * 这里不再依赖 Casbin 直接做对象匹配，
     * 而是先解析角色直绑资源与资源组展开资源，再统一按通配符规则匹配。
     *
     * @param sub 主体
     * @param domain 租户域
     * @param type 权限类型
     * @param obj 资源标识
     * @return 是否拥有权限
     */
    public boolean hasPermission(String sub, String domain, String type, String obj) {
        if (!StringUtils.hasText(sub) || !StringUtils.hasText(domain)) {
            return false;
        }
        if (!PermissionType.MENU.equals(type) && !PermissionType.API.equals(type)) {
            return false;
        }

        Long tenantId;
        try {
            tenantId = Long.parseLong(domain);
        } catch (NumberFormatException exception) {
            return false;
        }
        Set<String> resourceNames = getUserGrantedResourceNames(sub, tenantId, type);
        return PermissionPathMatcher.matchesAny(resourceNames, obj);
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
     * 获取角色拥有的直接资源策略。
     *
     * @param roleCode 角色编码
     * @return 资源策略列表
     */
    public List<List<String>> getPermissionsForRole(String roleCode) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        return enforcer.getFilteredPolicy(
                        0,
                        toRoleSubject(roleCode),
                        toDomain(currentTenantId)
                )
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
        List<String> menuResources = loadDirectResourceNamesByRole(
                roleCode,
                currentTenantId,
                PermissionType.MENU
        );
        List<String> apiResources = loadDirectResourceNamesByRole(
                roleCode,
                currentTenantId,
                PermissionType.API
        );
        log.info(
                "角色权限读取：roleCode={} tenantId={} menuResources={} apiResources={}",
                roleCode,
                currentTenantId,
                menuResources,
                apiResources
        );
        return RolePermissionVo.builder()
                .menuResources(menuResources)
                .apiResources(apiResources)
                .resourceGroupCodes(loadRolePermissionGroupCodes(roleCode, currentTenantId))
                .build();
    }

    /**
     * 批量更新角色的直接资源与资源组绑定。
     *
     * @param roleCode 角色编码
     * @param resources 直接绑定的资源路径列表
     * @param resourceGroupCodes 资源组编码列表
     */
    @Transactional
    public void updateRolePermissions(String roleCode,
                                      List<String> menuResources,
                                      List<String> apiResources,
                                      List<String> resourceGroupCodes) {
        roleService.requireRoleByCode(roleCode);
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<String> normalizedMenuResources = permissionResourceValidator.normalizeMenuResourceNames(
                menuResources,
                currentTenantId
        );
        List<String> normalizedApiResources = permissionResourceValidator.normalizeApiResourceNames(
                apiResources,
                currentTenantId
        );
        Set<String> normalizedGroupCodes = permissionGroupService.normalizeGroupCodes(resourceGroupCodes);
        if (!normalizedGroupCodes.isEmpty()) {
            Map<String, List<String>> groupResourceMap = permissionGroupService.getResourceMapByGroupCodes(
                    normalizedGroupCodes
            );
            for (List<String> groupResources : groupResourceMap.values()) {
                permissionResourceValidator.normalizeResourceNames(groupResources, currentTenantId);
            }
        }

        enforcer.removeFilteredPolicy(
                0,
                toRoleSubject(roleCode),
                toDomain(currentTenantId),
                PermissionType.MENU
        );
        enforcer.removeFilteredPolicy(
                0,
                toRoleSubject(roleCode),
                toDomain(currentTenantId),
                PermissionType.API
        );

        log.info(
                "角色权限更新：已清理旧直绑策略 roleCode={} tenantId={}",
                roleCode,
                currentTenantId
        );
        rolePermissionGroupMapper.delete(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(RolePermissionGroup.class)
                        .eq(RolePermissionGroup::getTenantId, currentTenantId)
                        .eq(RolePermissionGroup::getRoleCode, roleCode)
        );

        for (String resource : normalizedMenuResources) {
            enforcer.addPermissionForUser(
                    toRoleSubject(roleCode),
                    toDomain(currentTenantId),
                    PermissionType.MENU,
                    resource
            );
        }
        for (String resource : normalizedApiResources) {
            enforcer.addPermissionForUser(
                    toRoleSubject(roleCode),
                    toDomain(currentTenantId),
                    PermissionType.API,
                    resource
            );
        }

        for (String groupCode : normalizedGroupCodes) {
            RolePermissionGroup relation = new RolePermissionGroup();
            relation.setTenantId(currentTenantId);
            relation.setRoleCode(roleCode);
            relation.setGroupCode(groupCode);
            rolePermissionGroupMapper.insert(relation);
        }
        persistCasbinPolicy();
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
                toUserSubject(userId),
                "",
                toDomain(currentTenantId)
        );
        for (List<String> policy : existingPolicies) {
            enforcer.removeGroupingPolicy(policy);
        }

        for (String roleCode : normalizedRoleCodes) {
            roleService.requireRoleByCode(roleCode);
            enforcer.addRoleForUserInDomain(
                    toUserSubject(userId),
                    toRoleSubject(roleCode),
                    toDomain(currentTenantId)
            );
        }
        persistCasbinPolicy();
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
                toRoleSubject(roleCode),
                toDomain(currentTenantId)
        );

        List<Long> result = new ArrayList<>();
        for (String userId : userIds) {
            String normalizedUserId = fromUserSubject(userId);
            if (!StringUtils.hasText(normalizedUserId)) {
                continue;
            }
            try {
                result.add(Long.parseLong(normalizedUserId));
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
                toRoleSubject(roleCode),
                toDomain(currentTenantId)
        );
        for (String userId : existingUsers) {
            enforcer.deleteRoleForUserInDomain(
                    userId,
                    toRoleSubject(roleCode),
                    toDomain(currentTenantId)
            );
        }

        for (Long userId : normalizedUserIds) {
            validateUserAccessible(String.valueOf(userId), currentTenantId);
            enforcer.addRoleForUserInDomain(
                    toUserSubject(String.valueOf(userId)),
                    toRoleSubject(roleCode),
                    toDomain(currentTenantId)
            );
        }
        persistCasbinPolicy();
    }

    /**
     * 计算用户在当前租户下拥有的最终资源集合。
     *
     * 这里先通过 Casbin 的 implicit permission 读取用户最终生效的
     * 直绑资源与角色继承资源，再叠加业务表中的资源组展开结果。
     *
     * @param userId 用户 ID
     * @param tenantId 租户 ID
     * @return 资源集合
     */
    private Set<String> getUserGrantedResourceNames(String userId,
                                                    Long tenantId,
                                                    String resourceType) {
        Set<String> resourceNames = new LinkedHashSet<>(
                loadImplicitResourceNamesByUser(userId, tenantId, resourceType)
        );
        List<String> roleCodes = loadRoleCodesForUser(userId, tenantId);
        for (String roleCode : roleCodes) {
            Set<String> groupResources = permissionGroupService.collectResourcesByGroupCodes(
                    loadRolePermissionGroupCodes(roleCode, tenantId)
            );
            for (String groupResource : groupResources) {
                if (!permissionResourceValidator.matchesResourceType(groupResource, resourceType)) {
                    continue;
                }
                if (!PermissionResource.isResourceAssignable(tenantId, groupResource)) {
                    continue;
                }
                resourceNames.add(groupResource);
            }
        }
        return resourceNames;
    }

    /**
     * 获取用户在指定租户下通过 Casbin 生效的直绑资源集合。
     *
     * 该读取会同时包含用户直绑策略与通过角色继承得到的策略，
     * 但不包含业务表中资源组展开出的资源。
     *
     * @param userId 用户 ID
     * @param tenantId 租户 ID
     * @param resourceType 资源类型
     * @return 资源路径列表
     */
    private Set<String> loadImplicitResourceNamesByUser(String userId,
                                                        Long tenantId,
                                                        String resourceType) {
        List<List<String>> policies = enforcer.getImplicitPermissionsForUserInDomain(
                toUserSubject(userId),
                toDomain(tenantId)
        );
        Set<String> resources = new LinkedHashSet<>();
        for (List<String> policy : policies) {
            if (policy.size() < 4) {
                continue;
            }
            if (!resourceType.equals(policy.get(2))) {
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
     * 获取角色在指定租户下直接绑定的资源集合。
     *
     * @param roleCode 角色编码
     * @param tenantId 租户 ID
     * @return 资源路径列表
     */
    private List<String> loadDirectResourceNamesByRole(String roleCode,
                                                       Long tenantId,
                                                       String resourceType) {
        /**
         * 这里直接按“角色主体 + 租户域”读取 Casbin 权限，
         * 返回结构为 `[domain, type, resource]`。
         *
         * 因此前两位分别是租户域和资源类型，
         * 不再需要从完整 `p` 策略中手动剥离主体字段。
         */
        List<List<String>> policies = enforcer.getPermissionsForUserInDomain(
                toRoleSubject(roleCode),
                toDomain(tenantId)
        );
        log.info(
                "角色资源原始策略读取：roleCode={} subject={} tenantId={} resourceType={} policies={}",
                roleCode,
                toRoleSubject(roleCode),
                tenantId,
                resourceType,
                policies
        );
        List<String> resources = new ArrayList<>();
        for (List<String> policy : policies) {
            if (policy.size() < 3) {
                continue;
            }
            if (!resourceType.equals(policy.get(2))) {
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
     * 获取角色在指定租户下最终生效的资源集合。
     *
     * @param roleCode 角色编码
     * @param tenantId 租户 ID
     * @return 生效资源集合
     */
    private Set<String> loadEffectiveResourceNamesByRole(String roleCode,
                                                         Long tenantId,
                                                         String resourceType) {
        Set<String> resources = new LinkedHashSet<>(
                loadDirectResourceNamesByRole(roleCode, tenantId, resourceType)
        );
        Set<String> groupResources = permissionGroupService.collectResourcesByGroupCodes(
                loadRolePermissionGroupCodes(roleCode, tenantId)
        );
        for (String groupResource : groupResources) {
            if (!permissionResourceValidator.matchesResourceType(groupResource, resourceType)) {
                continue;
            }
            resources.add(groupResource);
        }

        Set<String> assignableResources = new LinkedHashSet<>();
        for (String resource : resources) {
            if (PermissionResource.isResourceAssignable(tenantId, resource)) {
                assignableResources.add(resource);
            }
        }
        return assignableResources;
    }

    /**
     * 获取角色绑定的资源组编码列表。
     *
     * @param roleCode 角色编码
     * @param tenantId 租户 ID
     * @return 资源组编码列表
     */
    private List<String> loadRolePermissionGroupCodes(String roleCode, Long tenantId) {
        if (rolePermissionGroupMapper == null) {
            return List.of();
        }
        List<RolePermissionGroup> relations = rolePermissionGroupMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(RolePermissionGroup.class)
                        .eq(RolePermissionGroup::getTenantId, tenantId)
                        .eq(RolePermissionGroup::getRoleCode, roleCode)
                        .orderByAsc(RolePermissionGroup::getId)
        );
        List<String> groupCodes = new ArrayList<>(relations.size());
        for (RolePermissionGroup relation : relations) {
            if (!StringUtils.hasText(relation.getGroupCode())) {
                continue;
            }
            groupCodes.add(relation.getGroupCode().trim());
        }
        return groupCodes;
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
                toUserSubject(userId),
                toDomain(tenantId)
        );
        List<String> normalizedRoles = new ArrayList<>();
        for (String roleCode : roles) {
            String normalizedRoleCode = fromRoleSubject(roleCode);
            if (!StringUtils.hasText(normalizedRoleCode)) {
                continue;
            }
            normalizedRoles.add(normalizedRoleCode);
        }
        return normalizedRoles;
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
     * 持久化当前 Casbin 策略。
     *
     * 设计意图：
     * 1. 当前权限变更链路同时维护 Casbin 策略与业务表数据；
     * 2. 仅依赖 adapter 的自动保存行为不够直观，也不利于排查“重启后策略丢失”问题；
     * 3. 因此这里在事务提交后显式执行一次 `savePolicy`，确保内存态与数据库最终一致。
     */
    private void persistCasbinPolicy() {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            enforcer.savePolicy();
                        }
                    }
            );
            return;
        }
        enforcer.savePolicy();
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
     * 该方法把命中的资源节点拆成“页面菜单”和“按钮权限”两个视图，
     * 让前端既能渲染侧边导航，也能直接做按钮级显隐。
     *
     * @param resourceNames 权限资源集合
     * @return 当前权限返回值
     */
    private CurrentPermissionVo buildCurrentPermission(Set<String> menuResourceNames,
                                                       Set<String> apiResourceNames) {
        List<Menu> matchedNodes = new ArrayList<>();
        for (Menu menu : menuService.listEnabledNodes()) {
            if (PermissionPathMatcher.matchesAny(menuResourceNames, menu.getName())) {
                matchedNodes.add(menu);
            }
        }
        return buildCurrentPermission(
                matchedNodes,
                apiResourceNames.stream().sorted(String::compareTo).toList()
        );
    }

    /**
     * 把命中的菜单节点拆分成菜单和按钮两个视图。
     *
     * @param menusOrButtons 命中的菜单与按钮节点
     * @return 当前权限返回值
     */
    /**
     * 把菜单节点、按钮资源与接口资源统一组装成返回结构。
     *
     * @param menusOrButtons 命中的菜单与按钮节点
     * @param apiResources 接口资源列表
     * @return 当前权限返回值
     */
    private CurrentPermissionVo buildCurrentPermission(List<Menu> menusOrButtons,
                                                       List<String> apiResources) {
        List<CurrentPermissionVo.MenuItemVo> menus = new ArrayList<>();
        LinkedHashSet<String> permissions = new LinkedHashSet<>();

        for (Menu menu : menusOrButtons) {
            if (MenuNodeTypeEnum.BUTTON.equals(menu.getNodeType())) {
                permissions.add(menu.getName());
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
        permissions.addAll(apiResources);

        return CurrentPermissionVo.builder()
                .menus(menus)
                .permissions(new ArrayList<>(permissions))
                .build();
    }

    /**
     * 组装超级管理员权限返回值。
     *
     * 超级管理员不依赖角色绑定，因此这里直接合并：
     * 1. 全部菜单/按钮资源；
     * 2. 后端扫描出的全部接口资源。
     *
     * @param currentTenantId 当前租户 ID
     * @return 当前权限返回值
     */
    private CurrentPermissionVo buildSuperAdminCurrentPermission(Long currentTenantId) {
        List<Menu> enabledNodes = menuService.listEnabledNodes();
        Set<String> mergedPermissionResources = new LinkedHashSet<>();
        Set<String> apiResources = new LinkedHashSet<>();

        for (Menu menu : enabledNodes) {
            if (!PermissionResource.isResourceAssignable(currentTenantId, menu.getName())) {
                continue;
            }
            mergedPermissionResources.add(menu.getName());
        }
        if (permissionResourceCatalogService != null) {
            for (String resourceName : permissionResourceCatalogService.getApiResourceNameSet()) {
                if (!PermissionResource.isResourceAssignable(currentTenantId, resourceName)) {
                    continue;
                }
                apiResources.add(resourceName);
            }
        }

        return buildCurrentPermission(
                mergedPermissionResources,
                apiResources
        );
    }

    /**
     * 构造 Casbin 用户主体。
     *
     * @param userId 用户 ID
     * @return Casbin 用户主体
     */
    private String toUserSubject(String userId) {
        return USER_SUBJECT_PREFIX + userId;
    }

    /**
     * 构造 Casbin 角色主体。
     *
     * @param roleCode 角色编码
     * @return Casbin 角色主体
     */
    private String toRoleSubject(String roleCode) {
        return ROLE_SUBJECT_PREFIX + roleCode;
    }

    /**
     * 从 Casbin 用户主体中还原用户 ID。
     *
     * @param subject Casbin 用户主体
     * @return 裸用户 ID
     */
    private String fromUserSubject(String subject) {
        if (!StringUtils.hasText(subject) || !subject.startsWith(USER_SUBJECT_PREFIX)) {
            return null;
        }
        return subject.substring(USER_SUBJECT_PREFIX.length());
    }

    /**
     * 从 Casbin 角色主体中还原角色编码。
     *
     * @param subject Casbin 角色主体
     * @return 裸角色编码
     */
    private String fromRoleSubject(String subject) {
        if (!StringUtils.hasText(subject) || !subject.startsWith(ROLE_SUBJECT_PREFIX)) {
            return null;
        }
        return subject.substring(ROLE_SUBJECT_PREFIX.length());
    }
}
