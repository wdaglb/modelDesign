package io.github.modelDesign.system.queue.systemMessage;

import io.github.modelDesign.system.configuration.SystemMessageKafkaProperties;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import io.github.modelDesign.system.service.systemMessage.SystemMessagePushTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统消息推送补偿调度器。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemMessagePushCompensationScheduler {
    /**
     * 推送任务服务。
     */
    private final SystemMessagePushTaskService systemMessagePushTaskService;

    /**
     * 推送事件生产者。
     */
    private final SystemMessagePushProducer systemMessagePushProducer;

    /**
     * 系统消息 Kafka 配置。
     */
    private final SystemMessageKafkaProperties systemMessageKafkaProperties;

    /**
     * 扫描待补偿推送任务并重新投递。
     */
    @Scheduled(fixedDelayString = "#{@systemMessageKafkaProperties.republishIntervalMilliseconds}")
    public void republishPendingTasks() {
        List<SystemMessagePushTask> pushTasks = systemMessagePushTaskService.listDuePendingTasks(
                LocalDateTime.now(),
                systemMessageKafkaProperties.getRepublishBatchSize());
        for (SystemMessagePushTask pushTask : pushTasks) {
            try {
                systemMessagePushProducer.publishTask(pushTask.getId(), pushTask.getMessageId(), pushTask.getAdapterCode());
            } catch (Exception exception) {
                log.error("系统消息补偿重投失败，pushTaskId={}", pushTask.getId(), exception);
            }
        }
    }
}
