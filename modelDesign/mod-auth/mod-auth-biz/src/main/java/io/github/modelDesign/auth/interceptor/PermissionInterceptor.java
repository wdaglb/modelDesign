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
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 权限鉴权拦截器。
 *
 * 该拦截器只处理显式声明了 {@link RequirePermission} 的控制器方法，
 * 用于把按钮级/菜单级权限收敛为统一的后端准入校验。
 */
@Component
@RequiredArgsConstructor
public class PermissionInterceptor implements HandlerInterceptor {
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
        if (permission == null) {
            return true;
        }

        if (hasAnyPermission(permission)) {
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
}
