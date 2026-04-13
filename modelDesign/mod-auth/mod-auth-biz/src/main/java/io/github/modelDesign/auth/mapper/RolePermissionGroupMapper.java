package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.RolePermissionGroup;
import org.apache.ibatis.annotations.Mapper;

/**
 * 角色权限资源组关系 Mapper。
 */
@Mapper
public interface RolePermissionGroupMapper extends BaseMapper<RolePermissionGroup> {
}
