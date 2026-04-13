package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 权限资源组列表项。
 */
@Data
@Builder
@Schema(description = "权限资源组列表项")
public class PermissionGroupListItemVo {
    /**
     * 资源组 ID。
     */
    private Long id;

    /**
     * 资源组名称。
     */
    private String name;

    /**
     * 资源组编码。
     */
    private String code;

    /**
     * 备注。
     */
    private String remark;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;
}
