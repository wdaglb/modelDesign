package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 权限资源组-资源关系。
 */
@Data
@TableName("permission_group_resource")
@EqualsAndHashCode(callSuper = true)
public class PermissionGroupResource extends BaseEntity {
    /**
     * 资源组 ID。
     */
    private Long groupId;

    /**
     * 资源标识。
     */
    private String resource;
}
