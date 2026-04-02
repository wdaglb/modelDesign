package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 职位。
 */
@Data
@TableName("position")
@EqualsAndHashCode(callSuper = true)
public class Position extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 职位名称。
     */
    private String name;

    /**
     * 职位编码。
     */
    private String code;

    /**
     * 备注。
     */
    private String remark;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 状态，1 表示启用，0 表示禁用。
     */
    private Integer status;
}
