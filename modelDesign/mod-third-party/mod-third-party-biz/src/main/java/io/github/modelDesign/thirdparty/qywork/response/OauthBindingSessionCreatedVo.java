package io.github.modelDesign.thirdparty.qywork.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建绑定会话响应。
 */
@Data
@Builder
@Schema(description = "创建绑定会话响应")
public class OauthBindingSessionCreatedVo {
    @Schema(description = "会话 ID")
    private String sessionId;

    @Schema(description = "入口模式")
    private String entryMode;

    @Schema(description = "企微内直接跳转授权地址")
    private String authUrl;

    @Schema(description = "二维码内容地址")
    private String qrCodeUrl;

    @Schema(description = "过期时间")
    private LocalDateTime expireAt;

    @Schema(description = "建议轮询间隔毫秒数")
    private Long pollIntervalMs;
}
