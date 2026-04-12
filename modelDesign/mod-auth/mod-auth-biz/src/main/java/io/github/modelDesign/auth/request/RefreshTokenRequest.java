package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Refresh token 刷新请求。
 */
@Data
@Schema(description = "Refresh token 刷新请求")
public class RefreshTokenRequest {
    /**
     * 当前 refresh token。
     */
    @NotBlank(message = "refreshToken 不能为空")
    @Schema(
            description = "当前 refresh token",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String refreshToken;
}
