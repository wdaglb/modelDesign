package io.github.modelDesign.auth.configuration;

import io.github.modelDesign.auth.interceptor.AuthInterceptor;
import io.github.modelDesign.auth.interceptor.PermissionInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AuthProperties.class)
public class AuthWebMvcConfigurer implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;
    private final PermissionInterceptor permissionInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/passport/password_login",
                        "/passport/register",
                        "/passport/refresh_token",
                        "/tenant/options",
                        "/third-party/qywork/binding/scan-entry",
                        "/third-party/qywork/oauth/callback",
                        "/error",
                        "/system/file/image/content/**",
                        "/system/file/image/thumbnail/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                );
        /**
         * 临时停用接口权限拦截。
         *
         * 当前仅保留登录态校验，方便先联调角色与页面授权链路；
         * 后续恢复接口权限校验时，只需要重新打开这一段注册代码。
         */
        // registry.addInterceptor(permissionInterceptor)
        //         .addPathPatterns("/**");
    }
}
