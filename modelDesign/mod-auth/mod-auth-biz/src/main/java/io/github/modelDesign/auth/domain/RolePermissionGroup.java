package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色-权限资源组关系。
 */
@Data
@TableName("role_permission_group")
@EqualsAndHashCode(callSuper = true)
public class RolePermissionGroup extends BaseEntity {
    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 角色编码。
     */
    private String roleCode;

    /**
     * 资源组编码。
     */
    private String groupCode;
}
