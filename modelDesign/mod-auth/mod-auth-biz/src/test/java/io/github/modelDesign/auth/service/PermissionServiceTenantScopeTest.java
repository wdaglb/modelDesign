package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.domain.Menu;
import io.github.modelDesign.auth.domain.Role;
import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import io.github.modelDesign.auth.response.CurrentPermissionVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.casbin.jcasbin.main.Enforcer;
import org.casbin.jcasbin.model.Model;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 权限服务租户域测试。
 */
class PermissionServiceTenantScopeTest {
    /**
     * 当前权限查询应只返回当前租户可分配的菜单和按钮资源。
     */
    @Test
    void getCurrentPermissionShouldFilterPlatformResourcesOutsidePlatformTenant() {
        Enforcer enforcer = createEnforcer();
        enforcer.addRoleForUserInDomain("101", "tenant-admin", "2002");
        enforcer.addPolicy("tenant-admin", "2002", "menu", PermissionResource.SYSTEM_USER);
        enforcer.addPolicy(
                "tenant-admin",
                "2002",
                "menu",
                PermissionResource.SYSTEM_USER_CREATE
        );
        enforcer.addPolicy("tenant-admin", "2002", "menu", PermissionResource.SYSTEM_TENANT);

        MenuService menuService = new StubMenuService(List.of(
                buildMenu(10L, 0L, PermissionResource.SYSTEM_USER, MenuNodeTypeEnum.MENU),
                buildMenu(11L, 10L, PermissionResource.SYSTEM_USER_CREATE, MenuNodeTypeEnum.BUTTON),
                buildMenu(12L, 0L, PermissionResource.SYSTEM_TENANT, MenuNodeTypeEnum.MENU)
        ));

        PermissionService permissionService = new PermissionService(
                menuService,
                new StubRoleService(),
                null,
                new StubCurrentAdminAccessor(101L, 2002L),
                enforcer
        );

        CurrentPermissionVo permissionVo = permissionService.getCurrentPermission();

        assertEquals(1, permissionVo.getMenus().size());
        assertEquals(PermissionResource.SYSTEM_USER, permissionVo.getMenus().get(0).getName());
        assertEquals(List.of(PermissionResource.SYSTEM_USER_CREATE), permissionVo.getButtons());
    }

    /**
     * 非平台租户不允许给角色分配平台级资源。
     */
    @Test
    void updateRoleMenuPermissionsShouldRejectPlatformResourcesForTenantRole() {
        PermissionService permissionService = new PermissionService(
                new StubMenuService(List.of()),
                new StubRoleService(),
                null,
                new StubCurrentAdminAccessor(101L, 2002L),
                createEnforcer()
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> permissionService.updateRoleMenuPermissions(
                        "tenant-admin",
                        List.of(PermissionResource.SYSTEM_TENANT)
                )
        );

        assertEquals("当前租户不能分配平台级权限", exception.getMessage());
    }

    /**
     * 创建测试用 Casbin 执行器。
     *
     * @return Casbin 执行器
     */
    private Enforcer createEnforcer() {
        String modelText = """
                [request_definition]
                r = sub, dom, type, obj

                [policy_definition]
                p = sub, dom, type, obj

                [role_definition]
                g = _, _, _

                [policy_effect]
                e = some(where (p.eft == allow))

                [matchers]
                m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.type == p.type && r.obj == p.obj
                """;
        Model model = new Model();
        model.loadModelFromText(modelText);
        return new Enforcer(model);
    }

    /**
     * 构造测试菜单节点。
     *
     * @param id 节点 ID
     * @param parentId 父节点 ID
     * @param name 节点名称
     * @param nodeType 节点类型
     * @return 菜单节点
     */
    private Menu buildMenu(Long id, Long parentId, String name, MenuNodeTypeEnum nodeType) {
        Menu menu = new Menu();
        menu.setId(id);
        menu.setParentId(parentId);
        menu.setName(name);
        menu.setTitle(name);
        menu.setNodeType(nodeType);
        menu.setIconType("none");
        menu.setIconValue("");
        return menu;
    }

    /**
     * 当前登录上下文测试替身。
     */
    private static final class StubCurrentAdminAccessor extends CurrentAdminAccessor {
        private final Long userId;
        private final Long tenantId;

        private StubCurrentAdminAccessor(Long userId, Long tenantId) {
            this.userId = userId;
            this.tenantId = tenantId;
        }

        @Override
        public Long requireCurrentUserId() {
            return userId;
        }

        @Override
        public Long requireCurrentTenantId() {
            return tenantId;
        }
    }

    /**
     * 菜单服务测试替身。
     */
    private static final class StubMenuService extends MenuService {
        private final List<Menu> menus;

        private StubMenuService(List<Menu> menus) {
            this.menus = menus;
        }

        @Override
        public List<Menu> listEnabledNodesByNames(Collection<String> names) {
            Set<String> nameSet = new LinkedHashSet<>(names);
            return menus.stream()
                    .filter(menu -> nameSet.contains(menu.getName()))
                    .toList();
        }

        @Override
        public Set<String> getExistingNameSet(Collection<String> names) {
            Set<String> existingNameSet = new LinkedHashSet<>();
            for (Menu menu : menus) {
                if (names.contains(menu.getName())) {
                    existingNameSet.add(menu.getName());
                }
            }
            return existingNameSet;
        }
    }

    /**
     * 角色服务测试替身。
     */
    private static final class StubRoleService extends RoleService {
        @Override
        public Role requireRoleByCode(String code) {
            Role role = new Role();
            role.setCode(code);
            return role;
        }
    }
}
