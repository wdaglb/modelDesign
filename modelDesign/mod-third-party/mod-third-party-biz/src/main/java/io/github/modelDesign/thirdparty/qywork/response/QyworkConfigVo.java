package io.github.modelDesign.thirdparty.qywork.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 企业微信配置视图对象。
 */
@Data
@Builder
@Schema(description = "企业微信配置")
public class QyworkConfigVo {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 企业微信 corpId。
     */
    @Schema(description = "企业微信 corpId")
    private String corpId;

    /**
     * 企业微信 corpSecret。
     */
    @Schema(description = "企业微信 corpSecret")
    private String corpSecret;

    /**
     * 企业微信应用 agentId。
     */
    @Schema(description = "企业微信应用 agentId")
    private String agentId;

    /**
     * 是否启用当前租户企业微信配置。
     */
    @Schema(description = "是否启用当前租户企业微信配置")
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
