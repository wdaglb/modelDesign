package io.github.modelDesign.auth.interceptor;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.service.PermissionService;
import io.github.modelDesign.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * 权限鉴权拦截器。
 *
 * 设计意图：
 * 1. 页面访问与少数复用接口继续支持显式声明 {@link RequirePermission}。
 * 2. 资源操作类接口不再要求逐个加注解，直接按接口路径做权限匹配。
 */
@Component
@RequiredArgsConstructor
public class PermissionInterceptor implements HandlerInterceptor {
    /**
     * 启用“按接口路径自动鉴权”的接口前缀集合。
     */
    private static final Set<String> AUTO_PATH_PERMISSION_PREFIXES = Set.of(
            "/project",
            "/permission-group",
            "/system/file/access-config",
            "/ai/chat"
    );

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 在控制器执行前完成权限校验。
     *
     * @param request HTTP 请求
     * @param response HTTP 响应
     * @param handler 当前处理器
     * @return 是否继续执行
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermission permission = resolvePermission(handlerMethod);
        if (permission == null && !shouldCheckByPath(request)) {
            return true;
        }

        if (permission != null && hasAnyPermission(permission)) {
            return true;
        }
        if (permission == null && hasPathPermission(request)) {
            return true;
        }

        throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权访问当前功能");
    }

    /**
     * 解析方法或类上的权限声明。
     *
     * 方法级声明优先级高于类级声明，
     * 以便在同一控制器中为不同接口配置更细粒度的权限。
     *
     * @param handlerMethod 当前处理方法
     * @return 权限声明
     */
    private RequirePermission resolvePermission(HandlerMethod handlerMethod) {
        RequirePermission permission = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(),
                RequirePermission.class
        );
        if (permission != null) {
            return permission;
        }
        return AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getBeanType(),
                RequirePermission.class
        );
    }

    /**
     * 判断当前请求是否满足权限声明。
     *
     * @param permission 权限声明
     * @return 是否满足
     */
    private boolean hasAnyPermission(RequirePermission permission) {
        String[] anyOf = permission.anyOf();
        if (anyOf != null && anyOf.length > 0) {
            for (String resource : anyOf) {
                if (permissionService.hasCurrentUserPermission(permission.type(), resource)) {
                    return true;
                }
            }
            return false;
        }
        return permissionService.hasCurrentUserPermission(permission.type(), permission.value());
    }

    /**
     * 判断当前接口是否走“按路径自动鉴权”。
     */
    private boolean shouldCheckByPath(HttpServletRequest request) {
        String requestPath = normalizePath(request.getServletPath());
        for (String prefix : AUTO_PATH_PERMISSION_PREFIXES) {
            if (requestPath.equals(prefix)) {
                return true;
            }
            if (requestPath.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }

    /**
     * 按当前接口路径直接做权限匹配。
     */
    private boolean hasPathPermission(HttpServletRequest request) {
        String requestPath = normalizePath(request.getServletPath());
        return permissionService.hasCurrentUserPermission("menu", requestPath);
    }

    /**
     * 统一整理请求路径。
     */
    private String normalizePath(String path) {
        if (!StringUtils.hasText(path)) {
            return "/";
        }
        String normalizedPath = path.trim();
        while (normalizedPath.length() > 1 && normalizedPath.endsWith("/")) {
            normalizedPath = normalizedPath.substring(0, normalizedPath.length() - 1);
        }
        return normalizedPath;
    }
}
