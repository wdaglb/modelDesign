package io.github.modelDesign.thirdparty.qywork.service;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 企业微信 Markdown 消息内容构建器。
 */
@Component
public class QyworkMarkdownMessageBuilder {
    private static final int MAX_CONTENT_LENGTH = 4000;
    private static final String OMITTED_SUFFIX = "...";

    /**
     * 构建系统消息对应的企业微信 Markdown 内容。
     *
     * @param title       系统消息标题
     * @param content     系统消息正文
     * @param redirectUrl 跳转地址
     * @return Markdown 内容
     */
    public String buildSystemMessageMarkdown(String title, String content, String redirectUrl) {
        String safeTitle = normalizeLineText(title, "系统消息");
        String safeContent = normalizeMultilineText(content, "");
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(safeTitle).append("\n\n");
        if (StringUtils.hasText(safeContent)) {
            builder.append(safeContent);
        }
        if (StringUtils.hasText(redirectUrl)) {
            if (builder.length() > 0) {
                builder.append("\n\n");
            }
            builder.append("[查看详情](").append(escapeLinkUrl(redirectUrl.trim())).append(")");
        }
        return truncate(builder.toString());
    }

    private String normalizeLineText(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        String normalizedValue = value.trim().replace('\r', ' ').replace('\n', ' ');
        return escapeMarkdownText(normalizedValue);
    }

    private String normalizeMultilineText(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        String normalizedValue = value.trim().replace("\r\n", "\n").replace('\r', '\n');
        return escapeMarkdownText(normalizedValue);
    }

    private String escapeMarkdownText(String value) {
        String escapedValue = value;
        escapedValue = escapedValue.replace("\\", "\\\\");
        escapedValue = escapedValue.replace("[", "\\[");
        escapedValue = escapedValue.replace("]", "\\]");
        escapedValue = escapedValue.replace("(", "\\(");
        escapedValue = escapedValue.replace(")", "\\)");
        return escapedValue;
    }

    private String escapeLinkUrl(String value) {
        return value.replace(")", "%29").replace(" ", "%20");
    }

    private String truncate(String value) {
        if (value.length() <= MAX_CONTENT_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_CONTENT_LENGTH - OMITTED_SUFFIX.length()) + OMITTED_SUFFIX;
    }
}
