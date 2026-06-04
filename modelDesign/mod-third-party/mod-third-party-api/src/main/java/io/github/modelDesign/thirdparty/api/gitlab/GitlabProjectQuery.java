package io.github.modelDesign.thirdparty.api.gitlab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GitLab 项目列表查询条件。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitlabProjectQuery {
    /**
     * 页码。
     */
    private Integer current;

    /**
     * 每页条数。
     */
    private Integer pageSize;

    /**
     * 搜索关键词。
     */
    private String keyword;
}
