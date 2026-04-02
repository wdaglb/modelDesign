package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 职位列表项。
 */
@Data
@Builder
@Schema(description = "职位列表项")
public class PositionListItemVo {
    /**
     * 职位 ID。
     */
    @Schema(description = "职位 ID")
    private Long id;

    /**
     * 所属租户 ID。
     */
    @Schema(description = "所属租户 ID")
    private Long tenantId;

    /**
     * 所属租户名称。
     */
    @Schema(description = "所属租户名称")
    private String tenantName;

    /**
     * 职位名称。
     */
    @Schema(description = "职位名称")
    private String name;

    /**
     * 职位编码。
     */
    @Schema(description = "职位编码")
    private String code;

    /**
     * 备注。
     */
    @Schema(description = "备注")
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
