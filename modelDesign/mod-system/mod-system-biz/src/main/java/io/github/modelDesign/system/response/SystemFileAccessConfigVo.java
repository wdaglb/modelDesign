package io.github.modelDesign.system.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文件访问配置视图对象。
 */
@Data
@Builder
@Schema(description = "文件访问配置")
public class SystemFileAccessConfigVo {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long tenantId;

    /**
     * 文件访问域名。
     */
    @Schema(description = "文件访问域名")
    private String accessDomain;

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
