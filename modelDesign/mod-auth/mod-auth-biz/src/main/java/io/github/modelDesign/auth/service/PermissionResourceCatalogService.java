package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.auth.response.PermissionResourceCatalogItemVo;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 权限资源目录服务。
 *
 * 设计意图：
 * 1. 基于 Spring MVC 的映射信息自动提取可分配资源，减少手工维护常量的成本。
 * 2. 对带路径变量的接口统一转成 `*` 通配规则，便于前端直接授权。
 * 3. 允许通过 {@link IgnorePermission} 排除登录、个人中心等无需进入权限目录的接口。
 */
@Service
public class PermissionResourceCatalogService {
    /**
     * 仅扫描业务代码包下的控制器，避免把 Spring 内部端点误带入资源目录。
     */
    private static final String BUSINESS_PACKAGE_PREFIX = "io.github.modelDesign";

    /**
     * Spring 上下文。
     *
     * 这里不直接注入 {@link RequestMappingHandlerMapping}，
     * 是为了避免在 MVC 配置阶段创建拦截器时再次反向依赖映射注册表，形成循环依赖。
     */
    private final ApplicationContext applicationContext;

    /**
     * 运行时构造函数。
     *
     * @param applicationContext Spring 上下文
     */
    public PermissionResourceCatalogService(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    /**
     * 获取接口资源目录。
     *
     * @return 资源目录
     */
    public List<PermissionResourceCatalogItemVo> getApiCatalog() {
        RequestMappingHandlerMapping requestMappingHandlerMapping =
                resolveRequestMappingHandlerMapping();
        if (requestMappingHandlerMapping == null) {
            return List.of();
        }

        Map<String, CatalogAccumulator> resourceMap = new LinkedHashMap<>();
        Map<RequestMappingInfo, HandlerMethod> handlerMethods =
                requestMappingHandlerMapping.getHandlerMethods();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
            HandlerMethod handlerMethod = entry.getValue();
            if (!isBusinessHandler(handlerMethod)) {
                continue;
            }
            if (shouldIgnore(handlerMethod)) {
                continue;
            }

            Set<String> patternValues = entry.getKey().getPatternValues();
            if (patternValues.isEmpty()) {
                continue;
            }

            List<String> methods = resolveHttpMethods(entry.getKey());
            String title = resolveTitle(handlerMethod);
            for (String patternValue : patternValues) {
                String resource = normalizeMappingPath(patternValue);
                CatalogAccumulator accumulator = resourceMap.computeIfAbsent(
                        resource,
                        key -> new CatalogAccumulator(resource, title)
                );
                accumulator.addMethods(methods);
            }
        }

        return resourceMap.values()
                .stream()
                .sorted(Comparator.comparing(CatalogAccumulator::resource))
                .map(CatalogAccumulator::toVo)
                .toList();
    }

    /**
     * 获取全部可校验的接口资源标识集合。
     *
     * @return 资源标识集合
     */
    public Set<String> getApiResourceNameSet() {
        Set<String> resources = new LinkedHashSet<>();
        for (PermissionResourceCatalogItemVo item : getApiCatalog()) {
            resources.add(item.getResource());
        }
        return resources;
    }

    /**
     * 将 Spring 映射路径转成统一权限资源。
     *
     * 这里会把 `{id}` 这类路径变量统一降级为 `*`，
     * 让资源目录天然适配运行时的通配符匹配规则。
     *
     * @param patternValue Spring 原始映射
     * @return 标准化后的权限资源
     */
    public String normalizeMappingPath(String patternValue) {
        if (!StringUtils.hasText(patternValue)) {
            return "/";
        }

        String normalizedPath = patternValue.trim();
        if (!normalizedPath.startsWith("/")) {
            normalizedPath = "/" + normalizedPath;
        }
        normalizedPath = normalizedPath.replaceAll("\\{[^/]+}", "*");
        while (normalizedPath.length() > 1 && normalizedPath.endsWith("/")) {
            normalizedPath = normalizedPath.substring(0, normalizedPath.length() - 1);
        }
        return normalizedPath;
    }

    /**
     * 延迟获取 Spring MVC 映射注册表。
     */
    private RequestMappingHandlerMapping resolveRequestMappingHandlerMapping() {
        if (applicationContext == null) {
            return null;
        }
        return applicationContext.getBeanProvider(RequestMappingHandlerMapping.class)
                .getIfAvailable();
    }

    /**
     * 判断处理器是否属于业务控制器。
     */
    private boolean isBusinessHandler(HandlerMethod handlerMethod) {
        return handlerMethod.getBeanType()
                .getPackageName()
                .startsWith(BUSINESS_PACKAGE_PREFIX);
    }

    /**
     * 判断处理器是否被显式排除出资源目录。
     */
    private boolean shouldIgnore(HandlerMethod handlerMethod) {
        Method method = handlerMethod.getMethod();
        if (AnnotatedElementUtils.hasAnnotation(method, IgnorePermission.class)) {
            return true;
        }
        return AnnotatedElementUtils.hasAnnotation(
                handlerMethod.getBeanType(),
                IgnorePermission.class
        );
    }

    /**
     * 解析映射绑定的 HTTP 方法集合。
     */
    private List<String> resolveHttpMethods(RequestMappingInfo mappingInfo) {
        Set<RequestMethod> requestMethods = mappingInfo.getMethodsCondition().getMethods();
        if (requestMethods.isEmpty()) {
            return List.of("ALL");
        }

        List<String> methods = new ArrayList<>(requestMethods.size());
        for (RequestMethod requestMethod : requestMethods) {
            methods.add(requestMethod.name());
        }
        methods.sort(String::compareTo);
        return methods;
    }

    /**
     * 优先使用 OpenAPI 摘要作为展示名称。
     */
    private String resolveTitle(HandlerMethod handlerMethod) {
        Operation operation = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(),
                Operation.class
        );
        if (operation != null && StringUtils.hasText(operation.summary())) {
            return operation.summary().trim();
        }

        Operation classOperation = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getBeanType(),
                Operation.class
        );
        if (classOperation != null && StringUtils.hasText(classOperation.summary())) {
            return classOperation.summary().trim();
        }

        return handlerMethod.getBeanType().getSimpleName() + "#" + handlerMethod.getMethod().getName();
    }

    /**
     * 资源聚合器。
     */
    private static final class CatalogAccumulator {
        /**
         * 聚合后的资源路径。
         */
        private final String resource;

        /**
         * 资源标题。
         */
        private final String title;

        /**
         * 资源对应的 HTTP 方法集合。
         */
        private final Set<String> methods = new LinkedHashSet<>();

        /**
         * 构造聚合器。
         *
         * @param resource 资源路径
         * @param title 资源标题
         */
        private CatalogAccumulator(String resource, String title) {
            this.resource = resource;
            this.title = title;
        }

        /**
         * 追加 HTTP 方法集合。
         *
         * @param items 方法集合
         */
        private void addMethods(List<String> items) {
            methods.addAll(items);
        }

        /**
         * 获取资源路径。
         *
         * @return 资源路径
         */
        private String resource() {
            return resource;
        }

        /**
         * 转换为响应对象。
         *
         * @return 响应对象
         */
        private PermissionResourceCatalogItemVo toVo() {
            return PermissionResourceCatalogItemVo.builder()
                    .resource(resource)
                    .title(title)
                    .methods(new ArrayList<>(methods))
                    .build();
        }
    }
}
