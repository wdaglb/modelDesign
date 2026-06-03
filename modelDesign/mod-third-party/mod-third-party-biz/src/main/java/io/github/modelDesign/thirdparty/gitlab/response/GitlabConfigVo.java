package io.github.modelDesign.thirdparty.gitlab.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * GitLab 配置视图对象。
 */
@Data
@Builder
@Schema(description = "GitLab 配置")
public class GitlabConfigVo {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * GitLab 服务器地址。
     */
    @Schema(description = "GitLab 服务器地址")
    private String serverUrl;

    /**
     * 是否已配置 Token。
     */
    @Schema(description = "是否已配置 Token")
    private Boolean tokenConfigured;

    /**
     * Token 脱敏显示值。
     */
    @Schema(description = "Token 脱敏显示值")
    private String tokenMasked;

    /**
     * 是否启用当前租户 GitLab 配置。
     */
    @Schema(description = "是否启用当前租户 GitLab 配置")
    private Boolean enabled;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    private String remark;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
