package io.github.modelDesign.thirdparty.provider.gitlab.v4;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * GitLab v4 项目响应。
 */
@Data
public class GitlabV4ProjectResponse {
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
    @JsonProperty("path_with_namespace")
    private String pathWithNamespace;

    /**
     * GitLab 项目网页地址。
     */
    @JsonProperty("web_url")
    private String webUrl;

    /**
     * GitLab 可见性。
     */
    private String visibility;

    /**
     * 默认分支。
     */
    @JsonProperty("default_branch")
    private String defaultBranch;

    /**
     * 最后活跃时间。
     */
    @JsonProperty("last_activity_at")
    private String lastActivityAt;
}
