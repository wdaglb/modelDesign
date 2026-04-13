package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.PermissionGroup;
import org.apache.ibatis.annotations.Mapper;

/**
 * 权限资源组 Mapper。
 */
@Mapper
public interface PermissionGroupMapper extends BaseMapper<PermissionGroup> {
}
