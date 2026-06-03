package io.github.modelDesign.thirdparty.gitlab.client;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * GitLab 项目分页结果。
 */
@Data
@AllArgsConstructor
public class GitlabProjectPageResult {
    /**
     * 项目列表。
     */
    private List<GitlabProjectResponse> items;

    /**
     * GitLab 响应头中的总数。
     */
    private Long total;
}
