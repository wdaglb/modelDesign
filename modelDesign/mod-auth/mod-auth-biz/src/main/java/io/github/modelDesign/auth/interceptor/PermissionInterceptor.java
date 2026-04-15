package io.github.modelDesign.auth.interceptor;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.auth.constant.PermissionType;
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

/**
 * 权限鉴权拦截器。
 *
 * 设计意图：
 * 1. 权限校验统一收敛到接口路径匹配，避免控制器继续维护逐个接口权限声明。
 * 2. 公共接口必须显式使用 {@link IgnorePermission} 标记，避免再依赖路径前缀推断。
 */
@Component
@RequiredArgsConstructor
public class PermissionInterceptor implements HandlerInterceptor {
    /**
     * 仅对业务代码包下的控制器启用路径鉴权。
     */
    private static final String BUSINESS_PACKAGE_PREFIX = "io.github.modelDesign";

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

        if (!shouldCheckPermission(handlerMethod)) {
            return true;
        }
        if (hasPathPermission(request)) {
            return true;
        }

        throw new BusinessException(HttpStatus.FORBIDDEN.value(), "无权访问当前功能");
    }

    /**
     * 判断当前处理器是否需要做权限校验。
     */
    private boolean shouldCheckPermission(HandlerMethod handlerMethod) {
        if (!handlerMethod.getBeanType().getPackageName().startsWith(BUSINESS_PACKAGE_PREFIX)) {
            return false;
        }
        if (AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), IgnorePermission.class)) {
            return false;
        }
        return !AnnotatedElementUtils.hasAnnotation(
                handlerMethod.getBeanType(),
                IgnorePermission.class
        );
    }

    /**
     * 按当前接口路径直接做权限匹配。
     */
    private boolean hasPathPermission(HttpServletRequest request) {
        String requestPath = normalizePath(request.getServletPath());
        return permissionService.hasCurrentUserPermission(
                PermissionType.API,
                requestPath
        );
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
