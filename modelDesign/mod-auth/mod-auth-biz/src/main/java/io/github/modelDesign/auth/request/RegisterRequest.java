package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 匿名注册请求。
 *
 * 当前首版注册直接创建启用状态用户，并在成功后立即签发登录态，
 * 因此这里只保留落库所需的最小字段集合。
 */
@Data
@Schema(description = "匿名注册请求")
public class RegisterRequest {
    /**
     * 用户昵称。
     */
    @Schema(description = "用户昵称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "用户昵称不能为空")
    @Size(max = 50, message = "用户昵称长度不能超过 50 个字符")
    private String nickname;

    /**
     * 用户名。
     */
    @Schema(description = "用户名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "用户名不能为空")
    @Size(max = 50, message = "用户名长度不能超过 50 个字符")
    private String username;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "租户不能为空")
    private Long tenantId;

    /**
     * 前端 md5 后的密码字符串。
     */
    @Schema(description = "前端 md5 后的密码字符串",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "密码不能为空")
    private String password;
}
