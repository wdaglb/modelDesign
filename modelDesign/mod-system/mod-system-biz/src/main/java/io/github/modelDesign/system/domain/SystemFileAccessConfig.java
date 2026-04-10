package io.github.modelDesign.system.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 租户文件访问配置。
 */
@Data
@TableName("systemFileAccessConfig")
@EqualsAndHashCode(callSuper = true)
public class SystemFileAccessConfig extends BaseEntity {
    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 文件访问域名。
     */
    private String accessDomain;

    /**
     * 备注。
     */
    private String remark;
}
