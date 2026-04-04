package io.github.modelDesign.thirdparty.qywork.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 当前用户企业微信绑定状态。
 */
@Data
@Builder
@Schema(description = "当前用户企业微信绑定状态")
public class UserOauthBindingStatusVo {
    @Schema(description = "平台标识")
    private String provider;

    @Schema(description = "租户配置是否完整")
    private Boolean configReady;

    @Schema(description = "当前是否允许发起绑定")
    private Boolean canStartBinding;

    @Schema(description = "当前是否已绑定")
    private Boolean isBound;

    @Schema(description = "第三方用户标识")
    private String providerUserId;

    @Schema(description = "绑定时间")
    private LocalDateTime boundAt;

    @Schema(description = "提示文案")
    private String message;
}
