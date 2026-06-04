package io.github.modelDesign.thirdparty.gitlab.service;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 已解密的 GitLab 调用配置。
 */
@Data
@AllArgsConstructor
public class GitlabResolvedConfig {
    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * GitLab 服务器地址。
     */
    private String serverUrl;

    /**
     * GitLab 明文 Token。
     */
    private String accessToken;

    /**
     * GitLab provider 编码。
     */
    private String providerCode;

    /**
     * GitLab provider 版本。
     */
    private String providerVersion;
}
