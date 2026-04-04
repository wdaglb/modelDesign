package io.github.modelDesign.auth.request;

import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 登录审计分页请求。
 */
@Data
@Schema(description = "登录审计分页请求")
public class LoginAuditPageRequest {
    /**
     * 页码。
     */
    @Schema(description = "页码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "页码不能为空")
    @Min(value = 1, message = "页码不能小于 1")
    private Long current = 1L;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "每页条数不能为空")
    @Min(value = 1, message = "每页条数不能小于 1")
    private Long pageSize = 10L;

    /**
     * 用户名关键字。
     */
    @Schema(description = "用户名关键字")
    private String username;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "租户不能为空")
    private Long tenantId;

    /**
     * 登录状态。
     */
    @Schema(description = "登录状态")
    private LoginAuditStatusEnum loginStatus;

    /**
     * 登录方式。
     */
    @Schema(description = "登录方式")
    private String loginType;

    /**
     * 设备类型。
     */
    @Schema(description = "设备类型")
    private LoginDeviceTypeEnum deviceType;
}
