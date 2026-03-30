package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 后台角色。
 */
@Data
@TableName("role")
@EqualsAndHashCode(callSuper = true)
public class Role extends BaseEntity {
    /**
     * 角色名称。
     */
    private String name;

    /**
     * 角色编码。
     */
    private String code;

    /**
     * 角色备注。
     */
    private String remark;

    /**
     * 同级排序值，越小越靠前。
     */
    private Integer sort;

    /**
     * 角色状态，1 表示启用，0 表示禁用。
     */
    private Integer status;
}
