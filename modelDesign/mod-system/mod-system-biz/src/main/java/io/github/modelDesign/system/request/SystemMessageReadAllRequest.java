package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 系统消息全部已读请求。
 */
@Data
@Schema(description = "系统消息全部已读请求")
public class SystemMessageReadAllRequest {
    /**
     * 关键字。
     */
    @Schema(description = "关键字，匹配标题与内容")
    @Size(max = 255, message = "关键字长度不能超过 255 个字符")
    private String keyword;

    /**
     * 读取状态。
     */
    @Schema(description = "读取状态", allowableValues = {"read", "unread"})
    @Size(max = 16, message = "读取状态长度不能超过 16 个字符")
    private String readStatus;
}
