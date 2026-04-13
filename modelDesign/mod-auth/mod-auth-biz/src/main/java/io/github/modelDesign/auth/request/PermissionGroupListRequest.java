package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 权限资源组列表请求。
 */
@Data
@Schema(description = "权限资源组列表请求")
public class PermissionGroupListRequest {
    /**
     * 当前页。
     */
    @Schema(description = "当前页")
    @Min(value = 1, message = "当前页不能小于 1")
    private Long current = 1L;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数不能小于 1")
    private Long pageSize = 10L;

    /**
     * 名称关键字。
     */
    @Schema(description = "名称关键字")
    private String name;

    /**
     * 编码关键字。
     */
    @Schema(description = "编码关键字")
    private String code;
}
