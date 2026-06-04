package io.github.modelDesign.thirdparty.api.gitlab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GitLab 项目结果。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitlabProjectResult {
    /**
     * GitLab 项目 ID。
     */
    private Long id;

    /**
     * GitLab 项目名称。
     */
    private String name;

    /**
     * GitLab 完整命名空间路径。
     */
    private String pathWithNamespace;

    /**
     * GitLab 项目网页地址。
     */
    private String webUrl;

    /**
     * GitLab 可见性。
     */
    private String visibility;

    /**
     * 默认分支。
     */
    private String defaultBranch;

    /**
     * 最后活跃时间。
     */
    private String lastActivityAt;
}
