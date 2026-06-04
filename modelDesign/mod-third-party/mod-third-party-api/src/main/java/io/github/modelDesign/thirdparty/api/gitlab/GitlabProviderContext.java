package io.github.modelDesign.thirdparty.api.gitlab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GitLab provider 调用上下文。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitlabProviderContext {
    /**
     * GitLab 服务器地址，不包含 API 版本路径。
     */
    private String serverUrl;

    /**
     * GitLab 明文访问 Token。
     */
    private String accessToken;
}
