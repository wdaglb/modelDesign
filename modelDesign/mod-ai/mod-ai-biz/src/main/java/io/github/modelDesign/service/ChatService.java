package io.github.modelDesign.service;

import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.alibaba.cloud.ai.graph.agent.hook.modelcalllimit.ModelCallLimitHook;
import com.alibaba.cloud.ai.graph.agent.hook.skills.SkillsAgentHook;
import com.alibaba.cloud.ai.graph.checkpoint.savers.MemorySaver;
import com.alibaba.cloud.ai.graph.skills.registry.classpath.ClasspathSkillRegistry;
import io.github.modelDesign.interceptor.ToolErrorInterceptor;
import io.github.modelDesign.tools.UserTool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
@Lazy
// 仅在启用 AI 开关时装配，确保未配置 OpenAI 时服务可正常启动
@ConditionalOnProperty(prefix = "model-design.ai", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChatService {

    private final RestClient restClient;

    private final AiModelService aiModelService;

    public String message(String message) {
        try {
            ChatClient chatClient = ChatClient.builder(this.aiModelService.get("test"))
                    .build();
            return chatClient.prompt()
                    .user(message)
                    .call()
                    .content();
        } catch (NonTransientAiException e) {
            log.error("Error occurred", e);
            return e.getMessage();
        }
    }

    public String test2(String msg) {
        OpenAiChatModel model = this.aiModelService.get("MiniMax-M2.7");

        ToolCallback userTool = FunctionToolCallback.builder("search", new UserTool())
                .description("查找学生")
                .inputType(Map.class)
                .build();

        SkillsAgentHook skillsAgentHook = SkillsAgentHook.builder()
                .skillRegistry(ClasspathSkillRegistry.builder()
                        .classpathPath("skills")
                        .build())
                .autoReload(true)
                .build();
//
//        ChatClient chatClient = ChatClient.builder(this.aiModelService.get("test"))
//                .build();
        ReactAgent agent = ReactAgent.builder()
                .name("my_agent")
                .model(model)
                .hooks(skillsAgentHook, ModelCallLimitHook.builder().runLimit(5).build()) // 最多调用5次，防止成本过高
//                .description("An agent that can perform calculations")
//                .instruction("你是一名资深的教务主任，负责处理学生事务。")
                .tools(userTool)
                .interceptors(new ToolErrorInterceptor())
                .saver(new MemorySaver())
                .build();

        try {
            AssistantMessage message = agent.call(msg);
            return message.getText();
        } catch (Exception e) {
            log.error("Error occurred", e);
            return e.getMessage();
        }
    }
}
