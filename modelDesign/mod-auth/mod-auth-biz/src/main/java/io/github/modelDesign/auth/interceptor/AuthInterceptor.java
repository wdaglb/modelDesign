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
import org.springframework.web.servlet.HandlerInterceptor;

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
        String token = request.getHeader("Authorization");
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        try {
            Claims claims = tokenService.parseAccessClaims(token);
            String loginId = claims.get("loginId", String.class);
            CurrentAdmin currentAdmin = sessionRepository.get(loginId);
            if (currentAdmin == null) {
                throw new UnauthorizedException("未登录或登录已过期");
            }
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
}
