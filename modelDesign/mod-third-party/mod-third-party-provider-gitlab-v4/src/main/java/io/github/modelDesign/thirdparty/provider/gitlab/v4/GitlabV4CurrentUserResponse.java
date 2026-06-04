package io.github.modelDesign.thirdparty.provider.gitlab.v4;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * GitLab v4 当前用户响应。
 */
@Data
public class GitlabV4CurrentUserResponse {
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
    @JsonProperty("web_url")
    private String webUrl;
}
