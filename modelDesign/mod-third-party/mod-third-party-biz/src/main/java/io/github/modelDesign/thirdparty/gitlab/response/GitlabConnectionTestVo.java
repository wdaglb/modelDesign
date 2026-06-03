package io.github.modelDesign.thirdparty.gitlab.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * GitLab 连接测试结果。
 */
@Data
@Builder
@Schema(description = "GitLab 连接测试结果")
public class GitlabConnectionTestVo {
    /**
     * 是否连接成功。
     */
    @Schema(description = "是否连接成功")
    private Boolean success;

    /**
     * GitLab 用户名。
     */
    @Schema(description = "GitLab 用户名")
    private String username;

    /**
     * GitLab 显示名称。
     */
    @Schema(description = "GitLab 显示名称")
    private String name;

    /**
     * GitLab 用户主页。
     */
    @Schema(description = "GitLab 用户主页")
    private String webUrl;

    /**
     * 结果说明。
     */
    @Schema(description = "结果说明")
    private String message;
}
