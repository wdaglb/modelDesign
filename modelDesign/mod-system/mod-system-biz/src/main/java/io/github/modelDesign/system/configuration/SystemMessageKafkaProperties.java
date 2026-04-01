package io.github.modelDesign.system.configuration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * 系统消息 Kafka 配置。
 */
@Data
@Component
@Validated
@ConfigurationProperties(prefix = "model-design.system.message.kafka")
public class SystemMessageKafkaProperties {
    /**
     * 推送主题。
     */
    @NotBlank(message = "系统消息推送主题不能为空")
    private String pushTopic = "model-design.system-message.push";

    /**
     * 死信主题。
     */
    @NotBlank(message = "系统消息死信主题不能为空")
    private String pushDltTopic = "model-design.system-message.push.dlt";

    /**
     * 最大重试次数。
     */
    @Min(value = 1, message = "系统消息最大重试次数必须大于 0")
    private Integer retryMaxAttempts = 3;

    /**
     * 重试间隔秒数。
     */
    @Min(value = 1, message = "系统消息重试间隔秒数必须大于 0")
    private Integer retryBackoffSeconds = 300;

    /**
     * 补偿重投间隔秒数。
     */
    @Min(value = 1, message = "系统消息补偿重投间隔秒数必须大于 0")
    private Integer republishIntervalSeconds = 30;

    /**
     * 单次补偿重投批次大小。
     */
    @Min(value = 1, message = "系统消息补偿重投批次大小必须大于 0")
    private Integer republishBatchSize = 100;

    /**
     * 获取补偿重投间隔毫秒数。
     *
     * @return 间隔毫秒数
     */
    public Long getRepublishIntervalMilliseconds() {
        return republishIntervalSeconds.longValue() * 1000L;
    }
}
