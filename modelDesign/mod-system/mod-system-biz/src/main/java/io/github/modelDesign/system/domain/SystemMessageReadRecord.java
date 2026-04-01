package io.github.modelDesign.system.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 系统消息已读记录。
 */
@Data
@TableName("systemMessageReadRecord")
@EqualsAndHashCode(callSuper = true)
public class SystemMessageReadRecord extends BaseEntity {
    /**
     * 消息 ID。
     */
    private Long messageId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 已读时间。
     */
    private LocalDateTime readTime;
}
