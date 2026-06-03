package io.github.modelDesign.thirdparty.gitlab.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * GitLab 项目响应。
 */
@Data
public class GitlabProjectResponse {
    /**
     * GitLab 项目 ID。
     */
    private Long id;

    /**
     * 项目名称。
     */
    private String name;

    /**
     * 含命名空间的项目路径。
     */
    @JsonProperty("path_with_namespace")
    private String pathWithNamespace;

    /**
     * 项目 Web 地址。
     */
    @JsonProperty("web_url")
    private String webUrl;

    /**
     * 可见性。
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
