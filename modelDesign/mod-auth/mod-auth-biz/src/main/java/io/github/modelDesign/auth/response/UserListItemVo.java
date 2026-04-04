package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 用户列表项。
 */
@Data
@Builder
@Schema(description = "用户列表项")
public class UserListItemVo {
    /**
     * 用户 ID。
     */
    @Schema(description = "用户 ID")
    private Long id;

    /**
     * 用户昵称。
     */
    @Schema(description = "用户昵称")
    private String nickname;

    /**
     * 用户名。
     */
    @Schema(description = "用户名")
    private String username;

    /**
     * 默认租户 ID。
     */
    @Schema(description = "默认租户 ID")
    private Long tenantId;

    /**
     * 默认租户名称。
     */
    @Schema(description = "默认租户名称")
    private String tenantName;

    /**
     * 头像文件 ID。
     */
    @Schema(description = "头像文件 ID")
    private String avatarId;

    /**
     * 角色名称列表。
     */
    @Schema(description = "角色名称列表")
    private List<String> roleNames;

    /**
     * 职位名称列表。
     */
    @Schema(description = "职位名称列表")
    private List<String> positionNames;

    /**
     * 是否已绑定角色。
     */
    @Schema(description = "是否已绑定角色")
    private Boolean hasRole;

    /**
     * 是否已绑定职位。
     */
    @Schema(description = "是否已绑定职位")
    private Boolean hasPosition;

    /**
     * 最近登录时间。
     */
    @Schema(description = "最近登录时间")
    private String lastLoginTime;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
