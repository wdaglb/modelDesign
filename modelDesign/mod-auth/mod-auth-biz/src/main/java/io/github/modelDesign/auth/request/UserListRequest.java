package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

/**
 * 用户列表请求。
 */
@Data
@Schema(description = "用户列表请求")
public class UserListRequest {
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
     * 搜索关键字。
     */
    @Schema(description = "搜索关键字")
    private String keyword;

    /**
     * 用户名。
     */
    @Schema(description = "用户名")
    private String username;

    /**
     * 用户 ID 列表。
     */
    @Schema(description = "用户 ID 列表")
    private List<Long> ids;

    /**
     * 用户昵称关键字。
     */
    @Schema(description = "用户昵称关键字")
    private String nickname;

    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 用户 ID。
     */
    @Schema(description = "用户 ID")
    private Long userId;

    /**
     * 是否停用。
     */
    @Schema(description = "是否停用")
    private Boolean isDisable;

    /**
     * 是否拥有角色。
     */
    @Schema(description = "是否拥有角色")
    private Boolean hasRole;

    /**
     * 是否拥有岗位。
     */
    @Schema(description = "是否拥有岗位")
    private Boolean hasPosition;
}
