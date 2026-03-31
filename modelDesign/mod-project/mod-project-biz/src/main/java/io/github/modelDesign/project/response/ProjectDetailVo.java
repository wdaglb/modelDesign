package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 项目详情。
 */
@Data
@Builder
@Schema(description = "项目详情")
public class ProjectDetailVo {
    /**
     * 项目 ID。
     */
    @Schema(description = "项目 ID")
    private Long id;

    /**
     * 项目编号。
     */
    @Schema(description = "项目编号")
    private String code;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称")
    private String name;

    /**
     * 项目描述。
     */
    @Schema(description = "项目描述")
    private String description;

    /**
     * 创建人名称。
     */
    @Schema(description = "创建人名称")
    private String creator;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;

    /**
     * 数据库类型。
     */
    @Schema(description = "数据库类型")
    private String dbType;
}
