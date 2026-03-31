package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 用户名密码登录请求。
 */
@Data
@Schema(description = "用户名密码登录请求")
public class PasswordLoginRequest {
    /**
     * 登录用户名。
     */
    @Schema(description = "登录用户名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "账号不能为空")
    private String username;

    /**
     * 前端 md5 后的密码字符串。
     */
    @Schema(description = "前端 md5 后的密码字符串", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "密码不能为空")
    private String password;
}
