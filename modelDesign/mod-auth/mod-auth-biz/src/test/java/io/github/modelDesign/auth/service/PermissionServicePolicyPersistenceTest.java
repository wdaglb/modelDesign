package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.Role;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.mapper.RolePermissionGroupMapper;
import io.github.modelDesign.auth.mapper.UserMapper;
import org.casbin.jcasbin.main.Enforcer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 权限策略持久化测试。
 */
class PermissionServicePolicyPersistenceTest {
    /**
     * 被测服务。
     */
    private PermissionService permissionService;

    /**
     * Casbin 执行器。
     */
    private Enforcer enforcer;

    /**
     * 当前登录上下文。
     */
    private CurrentAdminAccessor currentAdminAccessor;

    /**
     * 角色服务。
     */
    private RoleService roleService;

    /**
     * 用户 Mapper。
     */
    private UserMapper userMapper;

    @BeforeEach
    void setUp() {
        MenuService menuService = mock(MenuService.class);
        roleService = mock(RoleService.class);
        userMapper = mock(UserMapper.class);
        currentAdminAccessor = mock(CurrentAdminAccessor.class);
        enforcer = mock(Enforcer.class);
        PermissionGroupService permissionGroupService = mock(PermissionGroupService.class);
        RolePermissionGroupMapper rolePermissionGroupMapper = mock(RolePermissionGroupMapper.class);
        PermissionResourceValidator permissionResourceValidator = mock(PermissionResourceValidator.class);

        when(currentAdminAccessor.requireCurrentTenantId()).thenReturn(1L);
        when(permissionResourceValidator.normalizeMenuResourceNames(anyList(), eq(1L)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(permissionResourceValidator.normalizeApiResourceNames(anyList(), eq(1L)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(permissionGroupService.normalizeGroupCodes(anyCollection())).thenReturn(Set.of());
        when(roleService.requireRoleByCode(any())).thenAnswer(invocation -> {
            Role role = new Role();
            role.setCode(invocation.getArgument(0));
            return role;
        });
        when(enforcer.getPermissionsForUserInDomain(any(), any())).thenReturn(List.of());
        when(enforcer.removeFilteredPolicy(any(Integer.class), any(), any(), any()))
                .thenReturn(true);

        permissionService = new PermissionService(
                menuService,
                roleService,
                userMapper,
                currentAdminAccessor,
                enforcer,
                permissionGroupService,
                rolePermissionGroupMapper,
                permissionResourceValidator,
                null
        );
    }

    /**
     * 角色资源更新后应显式保存 Casbin 策略。
     */
    @Test
    void updateRolePermissionsShouldPersistPolicy() {
        permissionService.updateRolePermissions(
                "admin",
                List.of("/system/user"),
                List.of("/user/list"),
                List.of()
        );

        verify(enforcer, times(1)).savePolicy();
        verify(enforcer, times(1)).removeFilteredPolicy(
                0,
                "role:admin",
                "1",
                "menu"
        );
        verify(enforcer, times(1)).removeFilteredPolicy(
                0,
                "role:admin",
                "1",
                "api"
        );
        verify(enforcer, times(1)).addPermissionForUser(
                "role:admin",
                "1",
                "menu",
                "/system/user"
        );
        verify(enforcer, times(1)).addPermissionForUser(
                "role:admin",
                "1",
                "api",
                "/user/list"
        );
    }

    /**
     * 用户绑定角色更新后应显式保存 Casbin 策略。
     */
    @Test
    void updateUserRolesShouldPersistPolicy() {
        User user = new User();
        user.setId(2L);
        user.setTenantId(1L);
        when(userMapper.selectById(2L)).thenReturn(user);

        permissionService.updateUserRoles("2", List.of("admin"));

        verify(enforcer, times(1)).savePolicy();
        verify(enforcer, times(1)).addRoleForUserInDomain(
                "user:2",
                "role:admin",
                "1"
        );
    }

    /**
     * 角色绑定用户更新后应显式保存 Casbin 策略。
     */
    @Test
    void updateRoleUsersShouldPersistPolicy() {
        User user = new User();
        user.setId(2L);
        user.setTenantId(1L);
        when(userMapper.selectById(anyLong())).thenReturn(user);
        when(enforcer.getUsersForRoleInDomain("role:admin", "1")).thenReturn(List.of());

        permissionService.updateRoleUsers("admin", List.of(2L));

        verify(enforcer, times(1)).savePolicy();
        verify(enforcer, times(1)).addRoleForUserInDomain(
                "user:2",
                "role:admin",
                "1"
        );
    }
}
