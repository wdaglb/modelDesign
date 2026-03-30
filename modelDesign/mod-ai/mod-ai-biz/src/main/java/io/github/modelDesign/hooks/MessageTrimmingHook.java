package io.github.modelDesign.hooks;

import com.alibaba.cloud.ai.graph.RunnableConfig;
import com.alibaba.cloud.ai.graph.agent.hook.HookPosition;
import com.alibaba.cloud.ai.graph.agent.hook.HookPositions;
import com.alibaba.cloud.ai.graph.agent.hook.messages.AgentCommand;
import com.alibaba.cloud.ai.graph.agent.hook.messages.MessagesModelHook;
import com.alibaba.cloud.ai.graph.agent.hook.messages.UpdatePolicy;
import org.springframework.ai.chat.messages.Message;

import java.util.List;

/**
 * 模型调用前执行，用于截断消息
 */
@HookPositions({HookPosition.BEFORE_MODEL})
public class MessageTrimmingHook extends MessagesModelHook {
    @Override
    public String getName() {
        return "MessageTrimmingHook";
    }

    @Override
    public AgentCommand beforeModel(List<Message> previousMessages, RunnableConfig config) {
        if (previousMessages.size() > 10) {
            List<Message> trimmedMessages = previousMessages.subList(previousMessages.size() - 10, previousMessages.size());
            return new AgentCommand(trimmedMessages, UpdatePolicy.REPLACE);
        }
        return new AgentCommand(previousMessages);
    }
}
