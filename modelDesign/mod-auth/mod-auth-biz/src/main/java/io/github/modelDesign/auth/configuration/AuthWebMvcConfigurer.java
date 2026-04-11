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
        registry.addInterceptor(permissionInterceptor)
                .addPathPatterns("/**");
    }
}
