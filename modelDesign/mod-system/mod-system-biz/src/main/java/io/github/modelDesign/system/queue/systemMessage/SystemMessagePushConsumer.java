package io.github.modelDesign.system.queue.systemMessage;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.system.api.SystemMessagePushAdapter;
import io.github.modelDesign.system.api.dto.SystemMessagePushContext;
import io.github.modelDesign.system.api.dto.SystemMessageScopeType;
import io.github.modelDesign.system.configuration.SystemMessageKafkaProperties;
import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import io.github.modelDesign.system.enums.SystemMessagePushTaskStatusEnum;
import io.github.modelDesign.system.service.systemMessage.SystemMessagePushAdapterRegistry;
import io.github.modelDesign.system.service.systemMessage.SystemMessagePushTaskService;
import io.github.modelDesign.system.service.systemMessage.SystemMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 系统消息推送事件消费者。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemMessagePushConsumer {
    /**
     * JSON 对象映射器。
     */
    private final ObjectMapper objectMapper;

    /**
     * 系统消息服务。
     */
    private final SystemMessageService systemMessageService;

    /**
     * 系统消息推送任务服务。
     */
    private final SystemMessagePushTaskService systemMessagePushTaskService;

    /**
     * 系统消息推送适配器注册表。
     */
    private final SystemMessagePushAdapterRegistry systemMessagePushAdapterRegistry;

    /**
     * 系统消息推送事件生产者。
     */
    private final SystemMessagePushProducer systemMessagePushProducer;

    /**
     * 系统消息 Kafka 配置。
     */
    private final SystemMessageKafkaProperties systemMessageKafkaProperties;

    /**
     * 消费推送事件。
     *
     * @param payload 事件内容
     */
    @KafkaListener(topics = "#{@systemMessageKafkaProperties.pushTopic}")
    public void onMessage(String payload) {
        SystemMessagePushEvent event = parseEvent(payload);
        if (event == null || event.getPushTaskId() == null) {
            return;
        }
        SystemMessagePushTask pushTask = systemMessagePushTaskService.getById(event.getPushTaskId());
        if (pushTask == null) {
            log.warn("系统消息推送任务不存在，pushTaskId={}", event.getPushTaskId());
            return;
        }
        if (!SystemMessagePushTaskStatusEnum.PENDING.name().equals(pushTask.getStatus())) {
            return;
        }
        boolean locked = systemMessagePushTaskService.tryLockPendingTask(pushTask.getId());
        if (!locked) {
            return;
        }
        SystemMessage message = systemMessageService.getById(pushTask.getMessageId());
        if (message == null || (message.getDeleted() != null && message.getDeleted().equals(1))) {
            handlePushFailure(pushTask, new IllegalStateException("系统消息不存在或已删除"));
            return;
        }
        try {
            SystemMessagePushAdapter adapter = systemMessagePushAdapterRegistry.requireAdapter(pushTask.getAdapterCode());
            adapter.push(buildPushContext(message));
            systemMessagePushTaskService.markSuccess(pushTask.getId());
        } catch (Exception exception) {
            handlePushFailure(pushTask, exception);
        }
    }

    private SystemMessagePushContext buildPushContext(SystemMessage message) {
        List<Long> receiverUserIds = new ArrayList<>();
        if (message.getReceiverUserId() != null) {
            receiverUserIds.add(message.getReceiverUserId());
        }
        return SystemMessagePushContext.builder()
                .messageId(message.getId())
                .scopeType(SystemMessageScopeType.valueOf(message.getScopeType()))
                .tenantId(message.getTenantId())
                .receiverUserIds(receiverUserIds)
                .category(message.getCategory())
                .title(message.getTitle())
                .content(message.getContent())
                .redirectUrl(message.getRedirectUrl())
                .build();
    }

    private void handlePushFailure(SystemMessagePushTask pushTask, Exception exception) {
        int nextRetryCount = resolveRetryCount(pushTask.getRetryCount()) + 1;
        String errorMessage = resolveErrorMessage(exception);
        if (nextRetryCount >= systemMessageKafkaProperties.getRetryMaxAttempts()) {
            systemMessagePushTaskService.markFailed(pushTask.getId(), nextRetryCount, errorMessage);
            publishDeadLetter(pushTask, nextRetryCount, errorMessage);
            return;
        }
        LocalDateTime nextRetryTime = LocalDateTime.now().plusSeconds(systemMessageKafkaProperties.getRetryBackoffSeconds());
        systemMessagePushTaskService.markRetry(pushTask.getId(), nextRetryCount, nextRetryTime, errorMessage);
    }

    private void publishDeadLetter(SystemMessagePushTask pushTask, int retryCount, String errorMessage) {
        try {
            systemMessagePushProducer.publishDeadLetter(new SystemMessagePushDeadLetterEvent(
                    pushTask.getId(),
                    pushTask.getMessageId(),
                    pushTask.getAdapterCode(),
                    retryCount,
                    errorMessage));
        } catch (Exception exception) {
            log.error("系统消息死信事件投递失败，pushTaskId={}", pushTask.getId(), exception);
        }
    }

    private SystemMessagePushEvent parseEvent(String payload) {
        if (!StringUtils.hasText(payload)) {
            return null;
        }
        try {
            return objectMapper.readValue(payload, SystemMessagePushEvent.class);
        } catch (Exception exception) {
            log.error("系统消息推送事件反序列化失败", exception);
            return null;
        }
    }

    private String resolveErrorMessage(Exception exception) {
        String errorMessage = exception.getMessage();
        if (!StringUtils.hasText(errorMessage)) {
            errorMessage = exception.getClass().getSimpleName();
        }
        if (errorMessage.length() > 1000) {
            return errorMessage.substring(0, 1000);
        }
        return errorMessage;
    }

    private int resolveRetryCount(Integer retryCount) {
        if (retryCount == null || retryCount < 0) {
            return 0;
        }
        return retryCount;
    }
}
