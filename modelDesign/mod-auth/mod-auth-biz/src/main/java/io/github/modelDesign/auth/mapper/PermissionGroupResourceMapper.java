package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.PermissionGroupResource;
import org.apache.ibatis.annotations.Mapper;

/**
 * 权限资源组资源关系 Mapper。
 */
@Mapper
public interface PermissionGroupResourceMapper extends BaseMapper<PermissionGroupResource> {
}
