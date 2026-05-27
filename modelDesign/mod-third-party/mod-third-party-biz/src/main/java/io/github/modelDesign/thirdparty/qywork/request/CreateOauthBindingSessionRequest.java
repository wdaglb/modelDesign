package io.github.modelDesign.thirdparty.qywork.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 创建企业微信绑定会话请求。
 */
@Data
@Schema(description = "创建企业微信绑定会话请求")
public class CreateOauthBindingSessionRequest {
    /**
     * 当前入口模式。
     */
    @Schema(description = "入口模式：in_app / desktop_qr", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "entryMode 不能为空")
    @Pattern(regexp = "^(in_app|desktop_qr)$", message = "entryMode 仅支持 in_app 或 desktop_qr")
    private String entryMode;

}
