package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 租户。
 */
@Data
@TableName("tenant")
@EqualsAndHashCode(callSuper = true)
public class Tenant extends BaseEntity {
    /**
     * 租户编码。
     */
    private String code;

    /**
     * 租户名称。
     */
    private String name;

    /**
     * 租户描述。
     */
    private String description;

    /**
     * 租户状态，1 表示启用，0 表示禁用。
     */
    private Integer status;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
