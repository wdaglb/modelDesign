package io.github.modelDesign.auth.interceptor;

import io.github.modelDesign.common.exception.UnauthorizedException;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

/**
 * 登录鉴权拦截器。
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {
    /**
     * JWT 服务。
     */
    private final TokenService tokenService;

    /**
     * 会话仓储。
     */
    private final SessionRepository sessionRepository;

    /**
     * 鉴权并写入上下文。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @param handler  当前处理器
     * @return 是否继续执行
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = resolveAuthorizationToken(request.getHeader("Authorization"));
        if (!StringUtils.hasText(token)) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        try {
            CurrentAdmin currentAdmin = resolveCurrentAdmin(request, token);
            AuthContext.set(currentAdmin);
            return true;
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
    }

    /**
     * 请求完成后清理上下文。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @param handler  当前处理器
     * @param ex       请求异常
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }

    /**
     * 兼容原有裸 token 与 Bearer Token 两种传法。
     *
     * @param authorizationHeader Authorization 头
     * @return 归一化 token
     */
    private String resolveAuthorizationToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            return "";
        }
        String normalizedValue = authorizationHeader.trim();
        if (normalizedValue.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return normalizedValue.substring(7).trim();
        }
        return normalizedValue;
    }

    /**
     * 根据 token 类型恢复当前用户。
     *
     * @param request 当前请求
     * @param token 归一化 token
     * @return 当前登录管理员
     */
    private CurrentAdmin resolveCurrentAdmin(HttpServletRequest request, String token) {
        Claims claims = tokenService.parseClaims(token);
        String tokenType = claims.get("tokenType", String.class);
        if (TokenService.MCP_TOKEN_TYPE.equals(tokenType)) {
            return buildCurrentAdminFromMcpClaims(request, claims);
        }
        Claims accessClaims = tokenService.parseAccessClaims(token);
        String loginId = accessClaims.get("loginId", String.class);
        CurrentAdmin currentAdmin = sessionRepository.get(loginId);
        if (currentAdmin == null) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        return currentAdmin;
    }

    /**
     * 从 MCP token 中恢复上下文。
     *
     * @param request 当前请求
     * @param claims MCP token 声明
     * @return 当前登录管理员
     */
    private CurrentAdmin buildCurrentAdminFromMcpClaims(
            HttpServletRequest request,
            Claims claims) {
        Long userId = parseLongValue(claims.getSubject());
        Long tenantId = claims.get("tenantId", Long.class);
        if (userId == null || tenantId == null) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        return CurrentAdmin.builder()
                .userId(userId)
                .tenantId(tenantId)
                .username(claims.get("username", String.class))
                .nickname(claims.get("nickname", String.class))
                .avatarId(claims.get("avatarId", String.class))
                .loginId("mcp-" + userId)
                .loginIp(request.getRemoteAddr())
                .tokenCreateTime(LocalDateTime.now())
                .build();
    }

    private Long parseLongValue(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
