package io.github.modelDesign.system.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 系统消息推送任务。
 */
@Data
@TableName("systemMessagePushTask")
@EqualsAndHashCode(callSuper = true)
public class SystemMessagePushTask extends BaseEntity {
    /**
     * 消息 ID。
     */
    private Long messageId;

    /**
     * 适配器编码。
     */
    private String adapterCode;

    /**
     * 推送状态。
     */
    private String status;

    /**
     * 重试次数。
     */
    private Integer retryCount;

    /**
     * 下次重试时间。
     */
    private LocalDateTime nextRetryTime;

    /**
     * 最后一次错误信息。
     */
    private String lastError;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 接收用户 ID。
     */
    private Long receiverUserId;
}
