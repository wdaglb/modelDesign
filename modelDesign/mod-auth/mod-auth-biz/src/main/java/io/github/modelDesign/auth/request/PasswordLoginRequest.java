package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 用户名密码登录请求。
 */
@Data
public class PasswordLoginRequest {
    /**
     * 登录用户名。
     */
    @NotBlank(message = "账号不能为空")
    private String username;

    /**
     * 前端 md5 后的密码字符串。
     */
    @NotBlank(message = "密码不能为空")
    private String password;
}
