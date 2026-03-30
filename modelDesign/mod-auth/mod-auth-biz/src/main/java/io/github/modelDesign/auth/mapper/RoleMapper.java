package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.Role;
import org.apache.ibatis.annotations.Mapper;

/**
 * 后台角色 Mapper。
 */
@Mapper
public interface RoleMapper extends BaseMapper<Role> {
}
