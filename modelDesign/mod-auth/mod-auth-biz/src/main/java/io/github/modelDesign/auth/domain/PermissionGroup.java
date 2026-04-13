package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 权限资源组。
 *
 * 权限资源组由平台统一维护，可被多个角色复用，
 * 用于把一组常用权限资源打包成可复用的授权模板。
 */
@Data
@TableName("permission_group")
@EqualsAndHashCode(callSuper = true)
public class PermissionGroup extends BaseEntity {
    /**
     * 资源组名称。
     */
    private String name;

    /**
     * 资源组编码。
     */
    private String code;

    /**
     * 资源组备注。
     */
    private String remark;

    /**
     * 同级排序值，越小越靠前。
     */
    private Integer sort;

    /**
     * 状态，1 表示启用，0 表示禁用。
     */
    private Integer status;
}
