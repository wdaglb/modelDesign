package io.github.modelDesign.auth.interceptor;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import io.github.modelDesign.common.exception.UnauthorizedException;
import io.github.modelDesign.time.ClientTimeZoneContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 登录拦截器测试。
 */
class AuthInterceptorTest {
    @AfterEach
    void clearAuthContext() {
        AuthContext.clear();
        ClientTimeZoneContext.clear();
    }

    /**
     * MCP token 应能在无登录会话时直接恢复上下文。
     */
    @Test
    void preHandleShouldAcceptMcpToken() {
        AuthProperties authProperties = new AuthProperties();
        TokenService tokenService = new TokenService(authProperties);
        SessionRepository sessionRepository = mock(SessionRepository.class);
        AuthInterceptor interceptor = new AuthInterceptor(
                tokenService,
                sessionRepository
        );

        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(2L)
                .tenantId(1L)
                .username("alice")
                .nickname("Alice")
                .build();
        String mcpToken = tokenService.createMcpToken(currentAdmin);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/ai/mcp");
        request.addHeader("Authorization", "Bearer " + mcpToken);
        request.addHeader(ClientTimeZoneContext.HEADER_NAME, "Asia/Shanghai");
        request.setRemoteAddr("127.0.0.1");
        ClientTimeZoneContext.set(
                request.getHeader(ClientTimeZoneContext.HEADER_NAME)
        );

        boolean result = interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        );

        assertEquals(true, result);
        CurrentAdmin resolvedAdmin = AuthContext.get();
        assertNotNull(resolvedAdmin);
        assertEquals(2L, resolvedAdmin.getUserId());
        assertEquals(1L, resolvedAdmin.getTenantId());
        assertEquals("alice", resolvedAdmin.getUsername());
        assertEquals(null, resolvedAdmin.getGitUsername());
        assertNotNull(resolvedAdmin.getTokenCreateTime());
    }

    /**
     * 普通 access token 仍应继续依赖登录会话。
     */
    @Test
    void preHandleShouldKeepAccessTokenSessionValidation() {
        AuthProperties authProperties = new AuthProperties();
        TokenService tokenService = new TokenService(authProperties);
        SessionRepository sessionRepository = mock(SessionRepository.class);
        AuthInterceptor interceptor = new AuthInterceptor(
                tokenService,
                sessionRepository
        );

        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(2L)
                .tenantId(1L)
                .username("alice")
                .loginId("login-1")
                .build();
        String accessToken = tokenService.createAccessToken(currentAdmin);
        when(sessionRepository.get("login-1")).thenReturn(currentAdmin);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", accessToken);

        boolean result = interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        );

        assertEquals(true, result);
        assertEquals("login-1", AuthContext.get().getLoginId());
    }

    /**
     * 缺少 token 时仍应返回未登录错误。
     */
    @Test
    void preHandleShouldRejectWhenAuthorizationMissing() {
        AuthInterceptor interceptor = new AuthInterceptor(
                new TokenService(new AuthProperties()),
                mock(SessionRepository.class)
        );

        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> interceptor.preHandle(
                        new MockHttpServletRequest(),
                        new MockHttpServletResponse(),
                        new Object()
                )
        );

        assertEquals("未登录或登录已过期", exception.getMessage());
    }
}
