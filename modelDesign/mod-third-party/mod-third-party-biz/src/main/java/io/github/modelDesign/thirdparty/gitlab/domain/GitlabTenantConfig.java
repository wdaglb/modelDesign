package io.github.modelDesign.thirdparty.gitlab.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * GitLab 租户私有配置。
 */
@Data
@TableName("gitlabTenantConfig")
@EqualsAndHashCode(callSuper = true)
public class GitlabTenantConfig extends BaseEntity {
    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * GitLab 服务器地址。
     */
    private String serverUrl;

    /**
     * GitLab 访问 Token 密文。
     */
    private String accessTokenCipher;

    /**
     * 当前租户 GitLab 配置是否启用。
     */
    private Boolean enabled;

    /**
     * GitLab provider 编码。
     */
    private String providerCode;

    /**
     * GitLab provider 版本。
     */
    private String providerVersion;

    /**
     * 备注。
     */
    private String remark;
}
