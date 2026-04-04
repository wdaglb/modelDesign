package io.github.modelDesign.thirdparty.qywork.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 租户企业微信配置。
 */
@Data
@TableName("qyworkCorpConfig")
@EqualsAndHashCode(callSuper = true)
public class QyworkCorpConfig extends BaseEntity {
    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 企业微信 corpId。
     */
    private String corpId;

    /**
     * 企业微信 corpSecret。
     */
    private String corpSecret;

    /**
     * 企业微信应用 agentId。
     */
    private String agentId;

    /**
     * 当前租户企业微信配置是否启用。
     */
    private Boolean enabled;

    /**
     * 备注。
     */
    private String remark;
}
