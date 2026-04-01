package io.github.modelDesign.system.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 系统消息发布命令。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMessagePublishCommand {
    /**
     * 消息作用域。
     */
    private SystemMessageScopeType scopeType;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 接收用户 ID 集合。
     */
    private List<Long> receiverUserIds;

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
     * 推送适配器编码集合。
     */
    private List<String> adapterCodes;
}
