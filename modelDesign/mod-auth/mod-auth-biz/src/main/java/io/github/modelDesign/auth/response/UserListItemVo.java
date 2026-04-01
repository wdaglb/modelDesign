package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

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
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
