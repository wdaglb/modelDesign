package io.github.modelDesign.system.queue.systemMessage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统消息推送死信事件。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemMessagePushDeadLetterEvent {
    /**
     * 推送任务 ID。
     */
    private Long pushTaskId;

    /**
     * 消息 ID。
     */
    private Long messageId;

    /**
     * 适配器编码。
     */
    private String adapterCode;

    /**
     * 已重试次数。
     */
    private Integer retryCount;

    /**
     * 错误信息。
     */
    private String errorMessage;
}
