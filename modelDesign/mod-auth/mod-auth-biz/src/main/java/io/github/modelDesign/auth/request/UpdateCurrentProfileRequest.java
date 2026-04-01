package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新当前登录用户资料请求。
 */
@Data
@Schema(description = "更新当前登录用户资料请求")
public class UpdateCurrentProfileRequest {
    /**
     * 用户昵称。
     */
    @Schema(description = "用户昵称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "用户昵称不能为空")
    @Size(max = 50, message = "用户昵称长度不能超过 50 个字符")
    private String nickname;

    /**
     * 头像文件 ID。
     */
    @Schema(description = "头像文件 ID")
    @Size(max = 64, message = "头像文件 ID 长度不能超过 64 个字符")
    private String avatarId;
}
