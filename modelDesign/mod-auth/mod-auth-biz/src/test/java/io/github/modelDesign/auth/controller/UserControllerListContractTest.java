package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.UserListRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.UserListItemVo;
import io.github.modelDesign.auth.service.TenantService;
import io.github.modelDesign.auth.service.UserListQueryContextFactory;
import io.github.modelDesign.auth.service.PermissionService;
import io.github.modelDesign.auth.service.UserPositionService;
import io.github.modelDesign.auth.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 用户列表接口参数绑定测试。
 */
class UserControllerListContractTest {
    /**
     * 列表接口应正确绑定统一搜索和高级筛选参数。
     */
    @Test
    void listShouldBindKeywordAndGovernanceFilters() throws Exception {
        FakeUserService userService = new FakeUserService();
        PermissionService permissionService = new PermissionService(null, null);
        UserPositionService userPositionService = new UserPositionService(null, null);

        UserController controller = new UserController(
                userService,
                permissionService,
                userPositionService
        );
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(
                        get("/user/list")
                                .param("keyword", "alice")
                                .param("username", "admin")
                                .param("userId", "1024")
                                .param("isDisable", "false")
                                .param("hasRole", "true")
                                .param("hasPosition", "false")
                )
                .andExpect(status().isOk());

        assertEquals("alice", userService.lastRequest.getKeyword());
        assertEquals("admin", userService.lastRequest.getUsername());
        assertEquals(1024L, userService.lastRequest.getUserId());
        assertEquals(Boolean.FALSE, userService.lastRequest.getIsDisable());
        assertEquals(Boolean.TRUE, userService.lastRequest.getHasRole());
        assertEquals(Boolean.FALSE, userService.lastRequest.getHasPosition());
    }

    /**
     * 用户服务测试替身。
     */
    private static final class FakeUserService extends UserService {
        private UserListRequest lastRequest;

        private FakeUserService() {
            super(
                    new TenantService(),
                    new UserListQueryContextFactory(),
                    null
            );
        }

        @Override
        public PageResponse<UserListItemVo> getList(UserListRequest request) {
            lastRequest = request;
            return new PageResponse<>(Collections.emptyList(), 0L);
        }
    }
}
