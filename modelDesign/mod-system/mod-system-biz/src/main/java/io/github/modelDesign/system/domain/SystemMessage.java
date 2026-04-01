package io.github.modelDesign.system.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统消息。
 */
@Data
@TableName("systemMessage")
@EqualsAndHashCode(callSuper = true)
public class SystemMessage extends BaseEntity {
    /**
     * 消息作用域。
     */
    private String scopeType;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 接收用户 ID。
     */
    private Long receiverUserId;

    /**
     * 消息分类。
     */
    private String category;

    /**
     * 消息标题。
     */
    private String title;

    /**
     * 消息内容。
     */
    private String content;

    /**
     * 跳转地址。
     */
    private String redirectUrl;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
