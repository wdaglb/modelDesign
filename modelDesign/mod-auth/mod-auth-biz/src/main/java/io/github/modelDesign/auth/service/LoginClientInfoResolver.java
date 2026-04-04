package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * 登录客户端信息解析器。
 */
@Component
public class LoginClientInfoResolver {
    /**
     * 未知信息占位值。
     */
    private static final String UNKNOWN_TEXT = "UNKNOWN";

    /**
     * 根据 User-Agent 解析登录客户端信息。
     *
     * @param userAgent 请求头中的 User-Agent
     * @return 解析后的客户端信息
     */
    public LoginClientInfo resolve(String userAgent) {
        if (userAgent == null) {
            return buildUnknownInfo();
        }
        String normalizedUserAgent = userAgent.trim();
        if (normalizedUserAgent.isEmpty()) {
            return buildUnknownInfo();
        }
        String lowerUserAgent = normalizedUserAgent.toLowerCase(Locale.ROOT);
        ParsedNameVersion browserInfo = parseBrowser(normalizedUserAgent,
                lowerUserAgent);
        ParsedNameVersion osInfo = parseOs(lowerUserAgent);
        LoginDeviceTypeEnum deviceType = parseDeviceType(lowerUserAgent);
        return LoginClientInfo.builder()
                .browserName(browserInfo.getName())
                .browserVersion(browserInfo.getVersion())
                .osName(osInfo.getName())
                .osVersion(osInfo.getVersion())
                .deviceType(deviceType)
                .build();
    }

    /**
     * 解析浏览器名称和版本。
     *
     * @param userAgent      原始 UA
     * @param lowerUserAgent 小写 UA
     * @return 浏览器信息
     */
    private ParsedNameVersion parseBrowser(String userAgent, String lowerUserAgent) {
        if (lowerUserAgent.contains("wxwork/")) {
            return new ParsedNameVersion("wxwork",
                    extractVersion(userAgent, lowerUserAgent, "wxwork/"));
        }
        if (lowerUserAgent.contains("micromessenger/")) {
            return new ParsedNameVersion("MicroMessenger",
                    extractVersion(userAgent, lowerUserAgent,
                            "micromessenger/"));
        }
        if (lowerUserAgent.contains("edg/")) {
            return new ParsedNameVersion("Edge",
                    extractVersion(userAgent, lowerUserAgent, "edg/"));
        }
        if (lowerUserAgent.contains("opr/")) {
            return new ParsedNameVersion("Opera",
                    extractVersion(userAgent, lowerUserAgent, "opr/"));
        }
        if (lowerUserAgent.contains("chrome/")) {
            return new ParsedNameVersion("Chrome",
                    extractVersion(userAgent, lowerUserAgent, "chrome/"));
        }
        if (lowerUserAgent.contains("firefox/")) {
            return new ParsedNameVersion("Firefox",
                    extractVersion(userAgent, lowerUserAgent, "firefox/"));
        }
        if (lowerUserAgent.contains("safari/")) {
            String version = extractVersion(userAgent, lowerUserAgent, "version/");
            if (UNKNOWN_TEXT.equals(version)) {
                version = extractVersion(userAgent, lowerUserAgent, "safari/");
            }
            return new ParsedNameVersion("Safari", version);
        }
        return new ParsedNameVersion(UNKNOWN_TEXT, UNKNOWN_TEXT);
    }

    /**
     * 解析操作系统名称和版本。
     *
     * @param lowerUserAgent 小写 UA
     * @return 操作系统信息
     */
    private ParsedNameVersion parseOs(String lowerUserAgent) {
        if (lowerUserAgent.contains("windows nt")) {
            String version = extractVersionFromLower(lowerUserAgent, "windows nt ");
            return new ParsedNameVersion("Windows", version);
        }
        if (lowerUserAgent.contains("iphone os")) {
            String version = extractVersionFromLower(lowerUserAgent, "iphone os ");
            return new ParsedNameVersion("iOS", version);
        }
        if (lowerUserAgent.contains("cpu os")) {
            String version = extractVersionFromLower(lowerUserAgent, "cpu os ");
            return new ParsedNameVersion("iOS", version);
        }
        if (lowerUserAgent.contains("android")) {
            String version = extractVersionFromLower(lowerUserAgent, "android ");
            return new ParsedNameVersion("Android", version);
        }
        if (lowerUserAgent.contains("mac os x")) {
            String version = extractVersionFromLower(lowerUserAgent, "mac os x ");
            return new ParsedNameVersion("macOS", version);
        }
        if (lowerUserAgent.contains("linux")) {
            return new ParsedNameVersion("Linux", UNKNOWN_TEXT);
        }
        return new ParsedNameVersion(UNKNOWN_TEXT, UNKNOWN_TEXT);
    }

    /**
     * 解析设备类型。
     *
     * @param lowerUserAgent 小写 UA
     * @return 设备类型枚举值
     */
    private LoginDeviceTypeEnum parseDeviceType(String lowerUserAgent) {
        if (lowerUserAgent.contains("ipad")) {
            return LoginDeviceTypeEnum.TABLET;
        }
        if (lowerUserAgent.contains("tablet")) {
            return LoginDeviceTypeEnum.TABLET;
        }
        if (lowerUserAgent.contains("mobile")) {
            return LoginDeviceTypeEnum.MOBILE;
        }
        if (lowerUserAgent.contains("iphone")) {
            return LoginDeviceTypeEnum.MOBILE;
        }
        if (lowerUserAgent.contains("android")) {
            return LoginDeviceTypeEnum.MOBILE;
        }
        if (lowerUserAgent.contains("wxwork")) {
            return LoginDeviceTypeEnum.MOBILE;
        }
        if (lowerUserAgent.contains("micromessenger")) {
            return LoginDeviceTypeEnum.MOBILE;
        }
        if (lowerUserAgent.contains("windows nt")) {
            return LoginDeviceTypeEnum.DESKTOP;
        }
        if (lowerUserAgent.contains("macintosh")) {
            return LoginDeviceTypeEnum.DESKTOP;
        }
        if (lowerUserAgent.contains("x11")) {
            return LoginDeviceTypeEnum.DESKTOP;
        }
        if (lowerUserAgent.contains("linux")) {
            return LoginDeviceTypeEnum.DESKTOP;
        }
        return LoginDeviceTypeEnum.UNKNOWN;
    }

    /**
     * 提取大小写保留的版本号并做归一化。
     *
     * @param userAgent      原始 UA
     * @param lowerUserAgent 小写 UA
     * @param marker         版本前缀
     * @return 版本号
     */
    private String extractVersion(String userAgent, String lowerUserAgent,
                                  String marker) {
        int begin = lowerUserAgent.indexOf(marker);
        if (begin < 0) {
            return UNKNOWN_TEXT;
        }
        int start = begin + marker.length();
        String rawVersion = collectVersionValue(userAgent, start);
        return normalizeVersion(rawVersion);
    }

    /**
     * 从小写 UA 中提取版本号并做归一化。
     *
     * @param lowerUserAgent 小写 UA
     * @param marker         版本前缀
     * @return 版本号
     */
    private String extractVersionFromLower(String lowerUserAgent, String marker) {
        int begin = lowerUserAgent.indexOf(marker);
        if (begin < 0) {
            return UNKNOWN_TEXT;
        }
        int start = begin + marker.length();
        String rawVersion = collectVersionValue(lowerUserAgent, start);
        return normalizeVersion(rawVersion);
    }

    /**
     * 按字符扫描方式收集版本号，避免引入额外解析依赖。
     *
     * @param content 内容
     * @param start   起始位置
     * @return 版本号原始片段
     */
    private String collectVersionValue(String content, int start) {
        if (start >= content.length()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (int index = start; index < content.length(); index++) {
            char current = content.charAt(index);
            if (Character.isDigit(current) || current == '.' || current == '_') {
                builder.append(current);
            } else {
                break;
            }
        }
        return builder.toString();
    }

    /**
     * 统一版本号格式，将下划线替换为点并处理空值。
     *
     * @param rawVersion 原始版本
     * @return 标准化版本
     */
    private String normalizeVersion(String rawVersion) {
        if (rawVersion == null) {
            return UNKNOWN_TEXT;
        }
        String normalized = rawVersion.trim();
        if (normalized.isEmpty()) {
            return UNKNOWN_TEXT;
        }
        return normalized.replace('_', '.');
    }

    /**
     * 构建全未知的默认返回值。
     *
     * @return 未知客户端信息
     */
    private LoginClientInfo buildUnknownInfo() {
        return LoginClientInfo.builder()
                .browserName(UNKNOWN_TEXT)
                .browserVersion(UNKNOWN_TEXT)
                .osName(UNKNOWN_TEXT)
                .osVersion(UNKNOWN_TEXT)
                .deviceType(LoginDeviceTypeEnum.UNKNOWN)
                .build();
    }

    /**
     * 名称与版本值结构体。
     */
    private static final class ParsedNameVersion {
        /**
         * 名称。
         */
        private final String name;

        /**
         * 版本。
         */
        private final String version;

        ParsedNameVersion(String name, String version) {
            this.name = name;
            this.version = version;
        }

        /**
         * 返回名称。
         *
         * @return 名称
         */
        public String getName() {
            return name;
        }

        /**
         * 返回版本。
         *
         * @return 版本
         */
        public String getVersion() {
            return version;
        }
    }
}
