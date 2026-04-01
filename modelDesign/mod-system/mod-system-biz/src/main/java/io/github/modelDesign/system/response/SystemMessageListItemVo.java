package io.github.modelDesign.system.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 系统消息列表项响应。
 */
@Data
@Builder
@Schema(description = "系统消息列表项响应")
public class SystemMessageListItemVo {
    /**
     * 消息 ID。
     */
    @Schema(description = "消息 ID")
    private Long id;

    /**
     * 消息作用域。
     */
    @Schema(description = "消息作用域")
    private String scopeType;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 接收用户 ID。
     */
    @Schema(description = "接收用户 ID")
    private Long receiverUserId;

    /**
     * 消息分类。
     */
    @Schema(description = "消息分类")
    private String category;

    /**
     * 消息标题。
     */
    @Schema(description = "消息标题")
    private String title;

    /**
     * 消息内容。
     */
    @Schema(description = "消息内容")
    private String content;

    /**
     * 跳转地址。
     */
    @Schema(description = "跳转地址")
    private String redirectUrl;

    /**
     * 是否已读。
     */
    @Schema(description = "是否已读")
    private Boolean isRead;

    /**
     * 已读时间。
     */
    @Schema(description = "已读时间")
    private String readAt;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;
}
