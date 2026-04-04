package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.response.UserListItemVo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 用户列表视图组装器测试。
 */
class UserListViewAssemblerTest {
    /**
     * 单个用户应正确组装出租户、角色、职位与时间字段。
     */
    @Test
    void assembleSingleUserSummary() {
        User user = new User();
        user.setId(101L);
        user.setNickname("小王");
        user.setUsername("wang");
        user.setTenantId(10L);
        user.setAvatarId("avatar-1");
        user.setStatus(1);
        user.setLastLoginTime(LocalDateTime.of(2025, 1, 2, 3, 4, 5));
        user.setUpdateTime(LocalDateTime.of(2025, 1, 3, 4, 5, 6));

        TenantService tenantService = new StubTenantService(Map.of(10L, "默认租户"));
        PermissionService permissionService = new StubPermissionService(
                Map.of(101L, List.of("admin"))
        );
        RoleService roleService = new StubRoleService(Map.of("admin", "管理员"));
        UserPositionService userPositionService = new StubUserPositionService(
                Map.of(101L, List.of(200L))
        );
        PositionService positionService = new StubPositionService(Map.of(200L, "经理"));

        UserListViewAssembler assembler = new UserListViewAssembler(
                tenantService,
                permissionService,
                userPositionService,
                roleService,
                positionService
        );

        List<UserListItemVo> items = assembler.assemble(List.of(user));

        assertEquals(1, items.size());
        UserListItemVo item = items.get(0);
        assertEquals("默认租户", item.getTenantName());
        assertEquals(List.of("管理员"), item.getRoleNames());
        assertEquals(List.of("经理"), item.getPositionNames());
        assertTrue(item.getHasRole());
        assertTrue(item.getHasPosition());
        assertFalse(item.getIsDisable());
        assertEquals("2025-01-02 03:04:05", item.getLastLoginTime());
        assertEquals("2025-01-03 04:05:06", item.getUpdatedAt());
    }

    /**
     * 租户服务桩。
     */
    private static class StubTenantService extends TenantService {
        private final Map<Long, String> tenantNameMap;

        private StubTenantService(Map<Long, String> tenantNameMap) {
            this.tenantNameMap = tenantNameMap;
        }

        @Override
        public Map<Long, String> getDisplayNameMapByIds(Collection<Long> tenantIds) {
            return tenantNameMap;
        }
    }

    /**
     * 权限服务桩。
     */
    private static class StubPermissionService extends PermissionService {
        private final Map<Long, List<String>> roleCodeMap;

        private StubPermissionService(Map<Long, List<String>> roleCodeMap) {
            super(null, null);
            this.roleCodeMap = roleCodeMap;
        }

        @Override
        public Map<Long, List<String>> getUserRoleCodesMap(Collection<Long> userIds) {
            return roleCodeMap;
        }
    }

    /**
     * 用户职位服务桩。
     */
    private static class StubUserPositionService extends UserPositionService {
        private final Map<Long, List<Long>> positionIdMap;

        private StubUserPositionService(Map<Long, List<Long>> positionIdMap) {
            super(null, null);
            this.positionIdMap = positionIdMap;
        }

        @Override
        public Map<Long, List<Long>> getUserPositionIdsMap(Collection<Long> userIds) {
            return positionIdMap;
        }
    }

    /**
     * 角色服务桩。
     */
    private static class StubRoleService extends RoleService {
        private final Map<String, String> roleNameMap;

        private StubRoleService(Map<String, String> roleNameMap) {
            this.roleNameMap = roleNameMap;
        }

        @Override
        public Map<String, String> getNameMapByCodes(Collection<String> roleCodes) {
            return roleNameMap;
        }
    }

    /**
     * 职位服务桩。
     */
    private static class StubPositionService extends PositionService {
        private final Map<Long, String> positionNameMap;

        private StubPositionService(Map<Long, String> positionNameMap) {
            super(null, null);
            this.positionNameMap = positionNameMap;
        }

        @Override
        public Map<Long, String> getNameMapByIds(Collection<Long> positionIds) {
            return positionNameMap;
        }
    }
}
