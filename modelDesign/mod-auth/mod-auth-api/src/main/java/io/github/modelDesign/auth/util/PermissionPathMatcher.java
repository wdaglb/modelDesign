package io.github.modelDesign.auth.util;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 权限路径匹配工具。
 *
 * 设计意图：
 * 1. 统一后端权限匹配语义，避免接口鉴权、当前权限回显和资源校验各自实现一套规则。
 * 2. 支持 `*` 与 `**` 两种通配符，并约定它们都包含父路径本身。
 * 3. 只允许整段路径使用通配符，避免出现 `abc*def` 这类难以维护的规则。
 */
public final class PermissionPathMatcher {
    /**
     * 单层通配符。
     */
    public static final String SINGLE_LEVEL_WILDCARD = "*";

    /**
     * 深层通配符。
     */
    public static final String MULTI_LEVEL_WILDCARD = "**";

    private PermissionPathMatcher() {
    }

    /**
     * 判断权限资源格式是否合法。
     *
     * @param resource 权限资源
     * @return 是否合法
     */
    public static boolean isValidPattern(String resource) {
        if (!StringUtils.hasText(resource)) {
            return false;
        }

        for (String segment : splitSegments(resource)) {
            if (segment.contains(SINGLE_LEVEL_WILDCARD)
                    && !SINGLE_LEVEL_WILDCARD.equals(segment)
                    && !MULTI_LEVEL_WILDCARD.equals(segment)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断权限模式是否命中目标资源。
     *
     * @param pattern 权限模式
     * @param resource 目标资源
     * @return 是否命中
     */
    public static boolean matches(String pattern, String resource) {
        if (!StringUtils.hasText(pattern) || !StringUtils.hasText(resource)) {
            return false;
        }
        if (!isValidPattern(pattern) || !isValidPattern(resource)) {
            return false;
        }

        List<String> patternSegments = splitSegments(pattern);
        List<String> resourceSegments = splitSegments(resource);
        return matches(patternSegments, 0, resourceSegments, 0);
    }

    /**
     * 判断多个权限模式中是否存在命中的一项。
     *
     * @param patterns 权限模式集合
     * @param resource 目标资源
     * @return 是否命中
     */
    public static boolean matchesAny(Collection<String> patterns, String resource) {
        if (patterns == null || patterns.isEmpty()) {
            return false;
        }
        for (String pattern : patterns) {
            if (matches(pattern, resource)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 递归匹配路径段。
     *
     * `*` 允许匹配零段或一段，用于满足“包含父路径本身”的约定；
     * `**` 允许匹配零段到多段，用于覆盖任意深度路径。
     */
    private static boolean matches(List<String> patternSegments,
                                   int patternIndex,
                                   List<String> resourceSegments,
                                   int resourceIndex) {
        if (patternIndex >= patternSegments.size()) {
            return resourceIndex >= resourceSegments.size();
        }

        String patternSegment = patternSegments.get(patternIndex);
        if (MULTI_LEVEL_WILDCARD.equals(patternSegment)) {
            for (int index = resourceIndex; index <= resourceSegments.size(); index++) {
                if (matches(patternSegments, patternIndex + 1, resourceSegments, index)) {
                    return true;
                }
            }
            return false;
        }

        if (SINGLE_LEVEL_WILDCARD.equals(patternSegment)) {
            if (matches(patternSegments, patternIndex + 1, resourceSegments, resourceIndex)) {
                return true;
            }
            if (resourceIndex < resourceSegments.size()) {
                return matches(patternSegments, patternIndex + 1, resourceSegments, resourceIndex + 1);
            }
            return false;
        }

        if (resourceIndex >= resourceSegments.size()) {
            return false;
        }
        if (!patternSegment.equals(resourceSegments.get(resourceIndex))) {
            return false;
        }
        return matches(patternSegments, patternIndex + 1, resourceSegments, resourceIndex + 1);
    }

    /**
     * 统一拆分路径段。
     *
     * @param resource 权限资源
     * @return 路径段列表
     */
    private static List<String> splitSegments(String resource) {
        String normalizedResource = normalize(resource);
        if ("/".equals(normalizedResource)) {
            return List.of();
        }

        String[] rawSegments = normalizedResource.substring(1).split("/");
        List<String> segments = new ArrayList<>(rawSegments.length);
        for (String segment : rawSegments) {
            if (segment.isEmpty()) {
                continue;
            }
            segments.add(segment);
        }
        return segments;
    }

    /**
     * 统一整理路径。
     *
     * @param resource 原始路径
     * @return 规范化路径
     */
    private static String normalize(String resource) {
        if (!StringUtils.hasText(resource)) {
            return "/";
        }
        String normalized = resource.trim();
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        while (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
