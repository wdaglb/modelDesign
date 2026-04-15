package io.github.modelDesign.controller;

import io.github.modelDesign.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 对话接口。
 */
@Tag(name = "AI 对话")
@RestController
@RequestMapping("/ai/chat")
// 仅在启用 AI 开关时暴露 AI 接口，避免关闭开关后出现无效入口
@ConditionalOnProperty(prefix = "model-design.ai", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 发送 AI 对话消息。
     *
     * @param message 用户消息
     * @return AI 回复
     */
    @Operation(summary = "发送 AI 对话消息")
    @PostMapping("/messages")
    public String messages(@RequestBody String message) {
        return this.chatService.test2(message);
    }
}
