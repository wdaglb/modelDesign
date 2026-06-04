package io.github.modelDesign.thirdparty.api.gitlab;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * GitLab 项目分页结果。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GitlabProjectPageResult {
    /**
     * GitLab 项目列表。
     */
    private List<GitlabProjectResult> items = Collections.emptyList();

    /**
     * 总条数。
     */
    private Long total = 0L;
}
