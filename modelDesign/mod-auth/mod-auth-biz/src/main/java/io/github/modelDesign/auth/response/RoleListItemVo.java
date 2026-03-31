package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 角色列表项。
 */
@Data
@Builder
@Schema(description = "角色列表项")
public class RoleListItemVo {
    /**
     * 角色 ID。
     */
    @Schema(description = "角色 ID")
    private Long id;

    /**
     * 角色名称。
     */
    @Schema(description = "角色名称")
    private String name;

    /**
     * 角色编码。
     */
    @Schema(description = "角色编码")
    private String code;

    /**
     * 角色备注。
     */
    @Schema(description = "角色备注")
    private String remark;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
