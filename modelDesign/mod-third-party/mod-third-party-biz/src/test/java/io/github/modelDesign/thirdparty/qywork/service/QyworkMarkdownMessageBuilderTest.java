package io.github.modelDesign.thirdparty.qywork.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 企业微信 Markdown 内容构建器测试。
 */
class QyworkMarkdownMessageBuilderTest {
    /**
     * 有跳转地址时应生成查看详情链接。
     */
    @Test
    void buildSystemMessageMarkdownShouldAppendLinkWhenRedirectUrlExists() {
        QyworkMarkdownMessageBuilder builder = new QyworkMarkdownMessageBuilder();

        String markdown = builder.buildSystemMessageMarkdown("任务通知", "请处理任务", "/agile-board/?taskId=1");

        assertTrue(markdown.contains("# 任务通知"));
        assertTrue(markdown.contains("请处理任务"));
        assertTrue(markdown.contains("[查看详情](/agile-board/?taskId=1)"));
    }

    /**
     * 无跳转地址时不输出空链接，避免企业微信展示无效入口。
     */
    @Test
    void buildSystemMessageMarkdownShouldSkipLinkWhenRedirectUrlMissing() {
        QyworkMarkdownMessageBuilder builder = new QyworkMarkdownMessageBuilder();

        String markdown = builder.buildSystemMessageMarkdown("任务通知", "请处理任务", "");

        assertFalse(markdown.contains("查看详情"));
    }

    /**
     * 超长正文应被截断，避免超过企业微信应用消息内容限制。
     */
    @Test
    void buildSystemMessageMarkdownShouldTruncateLongContent() {
        QyworkMarkdownMessageBuilder builder = new QyworkMarkdownMessageBuilder();

        String markdown = builder.buildSystemMessageMarkdown("任务通知", "a".repeat(5000), "");

        assertTrue(markdown.length() <= 4000);
        assertTrue(markdown.endsWith("..."));
    }
}
