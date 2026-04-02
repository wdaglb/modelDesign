package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 职位列表请求。
 */
@Data
@Schema(description = "职位列表请求")
public class PositionListRequest {
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
     * 职位名称关键字。
     */
    @Schema(description = "职位名称关键字")
    @Size(max = 64, message = "职位名称长度不能超过 64 个字符")
    private String name;

    /**
     * 职位编码关键字。
     */
    @Schema(description = "职位编码关键字")
    @Size(max = 64, message = "职位编码长度不能超过 64 个字符")
    private String code;

    /**
     * 所属租户 ID。
     */
    @Schema(description = "所属租户 ID")
    private Long tenantId;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
