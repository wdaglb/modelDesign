package io.github.modelDesign.service;

import io.github.modelDesign.tools.ProjectTaskTools;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Lazy
// 仅在启用 AI 开关时装配，确保未配置 OpenAI 时服务可正常启动
@ConditionalOnProperty(prefix = "model-design.ai", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChatService {
    private final AiModelService aiModelService;

    private final ObjectProvider<ProjectTaskTools> projectTaskToolsProvider;

    public String message(String message) {
        try {
            return ChatClient.create(this.aiModelService.get("MiniMax-M2.7"))
                    .prompt()
                    .tools(resolveRegisteredTools())
                    .user(message)
                    .call()
                    .content();
        } catch (NonTransientAiException e) {
            log.error("Error occurred", e);
            return e.getMessage();
        }
    }

    public String test2(String msg) {
        return message(msg);
    }

    /**
     * 解析当前可注册的 MCP 工具列表。
     *
     * MCP 工具开关与 AI 总开关拆开后，这里只在对应工具 Bean 真正装配时
     * 才注册到模型调用链，避免 AI 开着但 MCP 工具仍被误注入。
     *
     * @return 已注册工具数组
     */
    Object[] resolveRegisteredTools() {
        ProjectTaskTools projectTaskTools = projectTaskToolsProvider.getIfAvailable();
        if (projectTaskTools == null) {
            return new Object[0];
        }
        return new Object[]{projectTaskTools};
    }
}
