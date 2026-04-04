package io.github.modelDesign.thirdparty.qywork.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 查询绑定会话状态响应。
 */
@Data
@Builder
@Schema(description = "绑定会话状态响应")
public class OauthBindingSessionStatusVo {
    @Schema(description = "会话 ID")
    private String sessionId;

    @Schema(description = "会话状态")
    private String status;

    @Schema(description = "失败码")
    private String failCode;

    @Schema(description = "失败信息")
    private String failMessage;

    @Schema(description = "第三方用户标识")
    private String providerUserId;

    @Schema(description = "完成时间")
    private LocalDateTime completedAt;

    @Schema(description = "过期时间")
    private LocalDateTime expireAt;
}
