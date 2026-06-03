package io.github.modelDesign.thirdparty.gitlab.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存 GitLab 配置请求。
 */
@Data
@Schema(description = "保存 GitLab 配置请求")
public class GitlabConfigSaveRequest {
    /**
     * GitLab 服务器地址。
     */
    @Schema(description = "GitLab 服务器地址", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "GitLab 服务器地址不能为空")
    @Size(max = 500, message = "GitLab 服务器地址长度不能超过 500 个字符")
    private String serverUrl;

    /**
     * GitLab 访问 Token。
     *
     * <p>新建配置时必填；更新配置时留空表示保留旧 Token。</p>
     */
    @Schema(description = "GitLab 访问 Token，更新时留空表示不修改")
    @Size(max = 5000, message = "GitLab Token 长度不能超过 5000 个字符")
    private String accessToken;

    /**
     * 是否启用当前租户 GitLab 配置。
     */
    @Schema(description = "是否启用当前租户 GitLab 配置")
    private Boolean enabled;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
