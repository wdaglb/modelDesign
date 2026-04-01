package io.github.modelDesign.system.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统消息未读数响应。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "系统消息未读数响应")
public class SystemMessageUnreadCountVo {
    /**
     * 未读数量。
     */
    @Schema(description = "未读数量")
    private Long unreadCount;
}
