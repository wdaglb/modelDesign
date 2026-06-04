package io.github.modelDesign.thirdparty.api.gitlab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GitLab 当前用户结果。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitlabCurrentUserResult {
    /**
     * GitLab 用户 ID。
     */
    private Long id;

    /**
     * GitLab 用户名。
     */
    private String username;

    /**
     * GitLab 显示名称。
     */
    private String name;

    /**
     * GitLab 用户主页地址。
     */
    private String webUrl;
}
