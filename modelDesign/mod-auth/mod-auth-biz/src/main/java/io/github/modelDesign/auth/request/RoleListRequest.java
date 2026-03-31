package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

/**
 * 角色列表请求。
 */
@Data
@Schema(description = "角色列表请求")
public class RoleListRequest {
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
     * 角色 ID 列表。
     */
    @Schema(description = "角色 ID 列表")
    private List<Long> ids;

    /**
     * 角色名称关键字。
     */
    @Schema(description = "角色名称关键字")
    private String name;

    /**
     * 角色编码关键字。
     */
    @Schema(description = "角色编码关键字")
    private String code;
}
