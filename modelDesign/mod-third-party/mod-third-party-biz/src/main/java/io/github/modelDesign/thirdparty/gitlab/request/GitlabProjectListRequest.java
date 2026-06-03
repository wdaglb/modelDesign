package io.github.modelDesign.thirdparty.gitlab.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * GitLab 项目列表请求。
 */
@Data
@Schema(description = "GitLab 项目列表请求")
public class GitlabProjectListRequest {
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
    @Max(value = 100, message = "每页条数不能超过 100")
    private Integer pageSize = 20;

    /**
     * 搜索关键词。
     */
    @Schema(description = "搜索关键词")
    @Size(max = 100, message = "搜索关键词长度不能超过 100 个字符")
    private String keyword;
}
