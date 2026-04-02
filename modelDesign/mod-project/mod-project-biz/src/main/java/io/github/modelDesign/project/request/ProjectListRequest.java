package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 项目列表请求。
 */
@Data
@Schema(description = "项目列表请求")
public class ProjectListRequest {
    /**
     * 当前页码。
     */
    @Schema(description = "当前页码")
    @Min(value = 1, message = "当前页码必须大于 0")
    private Integer current = 1;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数必须大于 0")
    private Integer pageSize = 10;

    /**
     * 搜索关键词。
     */
    @Schema(description = "搜索关键词，匹配项目名称和项目编号")
    @Size(max = 128, message = "搜索关键词长度不能超过 128 个字符")
    private String keyword;

    /**
     * 兼容旧版的项目名称筛选字段。
     */
    @Schema(description = "项目名称（兼容旧参数）", deprecated = true)
    @Size(max = 128, message = "项目名称长度不能超过 128 个字符")
    private String name;

    /**
     * 项目状态。
     */
    @Schema(description = "项目状态", allowableValues = {"planning", "inProgress", "atRisk", "archived"})
    @Size(max = 32, message = "项目状态长度不能超过 32 个字符")
    private String status;

    /**
     * 项目分组。
     */
    @Schema(description = "项目分组")
    @Size(max = 64, message = "项目分组长度不能超过 64 个字符")
    private String projectGroup;
}
