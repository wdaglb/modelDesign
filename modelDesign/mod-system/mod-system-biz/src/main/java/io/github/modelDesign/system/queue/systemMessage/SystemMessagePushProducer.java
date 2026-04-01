package io.github.modelDesign.system.queue.systemMessage;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.system.configuration.SystemMessageKafkaProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 系统消息推送事件生产者。
 */
@Component
@RequiredArgsConstructor
public class SystemMessagePushProducer {
    /**
     * Kafka 模板。
     */
    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * JSON 对象映射器。
     */
    private final ObjectMapper objectMapper;

    /**
     * 系统消息 Kafka 配置。
     */
    private final SystemMessageKafkaProperties systemMessageKafkaProperties;

    /**
     * 发送推送事件。
     *
     * @param pushTaskId  推送任务 ID
     * @param messageId   消息 ID
     * @param adapterCode 适配器编码
     */
    public void publishTask(Long pushTaskId, Long messageId, String adapterCode) {
        SystemMessagePushEvent event = new SystemMessagePushEvent(pushTaskId, messageId, adapterCode);
        send(systemMessageKafkaProperties.getPushTopic(), buildMessageKey(pushTaskId), toJson(event));
    }

    /**
     * 发送死信事件。
     *
     * @param deadLetterEvent 死信事件
     */
    public void publishDeadLetter(SystemMessagePushDeadLetterEvent deadLetterEvent) {
        send(systemMessageKafkaProperties.getPushDltTopic(), buildMessageKey(deadLetterEvent.getPushTaskId()), toJson(deadLetterEvent));
    }

    private void send(String topic, String key, String payload) {
        try {
            kafkaTemplate.send(topic, key, payload).get(10, TimeUnit.SECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("系统消息 Kafka 事件投递被中断", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("系统消息 Kafka 事件投递失败", exception);
        }
    }

    private String buildMessageKey(Long pushTaskId) {
        if (pushTaskId == null) {
            return "";
        }
        return String.valueOf(pushTaskId);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("系统消息事件序列化失败", exception);
        }
    }
}
