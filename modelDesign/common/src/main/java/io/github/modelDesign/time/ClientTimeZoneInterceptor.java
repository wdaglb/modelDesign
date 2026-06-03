package io.github.modelDesign.time;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 客户端时区拦截器。
 *
 * <p>该拦截器只负责请求级时区上下文，不参与鉴权与业务判断。独立拆分的原因是：
 * 即使鉴权拦截器后续抛出未登录异常，也能由 Spring MVC 按当前拦截器链回调
 * afterCompletion，从而可靠清理 ThreadLocal，避免复用工作线程时串请求。</p>
 */
@Component
public class ClientTimeZoneInterceptor implements HandlerInterceptor {
    /**
     * 从请求头读取客户端时区并写入当前线程上下文。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @param handler  当前处理器
     * @return 是否继续执行
     */
    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) {
        ClientTimeZoneContext.set(request.getHeader(ClientTimeZoneContext.HEADER_NAME));
        return true;
    }

    /**
     * 请求完成后清理时区上下文。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @param handler  当前处理器
     * @param ex       请求异常
     */
    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) {
        ClientTimeZoneContext.clear();
    }
}
