package io.github.modelDesign.thirdparty.qywork.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    /**
     * 当前前端公开 origin。
     */
    @Schema(description = "当前前端公开 origin", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "origin 不能为空")
    @Size(max = 255, message = "origin 长度不能超过 255 个字符")
    private String origin;
}
