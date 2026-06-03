package io.github.modelDesign.thirdparty.gitlab.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * GitLab 项目视图对象。
 */
@Data
@Builder
@Schema(description = "GitLab 项目")
public class GitlabProjectVo {
    /**
     * GitLab 项目 ID。
     */
    @Schema(description = "GitLab 项目 ID")
    private Long id;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称")
    private String name;

    /**
     * 含命名空间的项目路径。
     */
    @Schema(description = "含命名空间的项目路径")
    private String pathWithNamespace;

    /**
     * 项目 Web 地址。
     */
    @Schema(description = "项目 Web 地址")
    private String webUrl;

    /**
     * 可见性。
     */
    @Schema(description = "可见性")
    private String visibility;

    /**
     * 默认分支。
     */
    @Schema(description = "默认分支")
    private String defaultBranch;

    /**
     * 最后活跃时间。
     */
    @Schema(description = "最后活跃时间")
    private String lastActivityAt;
}
