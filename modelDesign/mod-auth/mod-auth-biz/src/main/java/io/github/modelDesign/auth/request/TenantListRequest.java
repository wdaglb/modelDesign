package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 租户列表请求。
 */
@Data
@Schema(description = "租户列表请求")
public class TenantListRequest {
    /**
     * 页码。
     */
    @Schema(description = "页码")
    @Min(value = 1, message = "页码不能小于 1")
    private Long current = 1L;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数不能小于 1")
    private Long pageSize = 10L;

    /**
     * 租户编码关键字。
     */
    @Schema(description = "租户编码关键字")
    @Size(max = 64, message = "租户编码长度不能超过 64 个字符")
    private String code;

    /**
     * 租户名称关键字。
     */
    @Schema(description = "租户名称关键字")
    @Size(max = 64, message = "租户名称长度不能超过 64 个字符")
    private String name;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
