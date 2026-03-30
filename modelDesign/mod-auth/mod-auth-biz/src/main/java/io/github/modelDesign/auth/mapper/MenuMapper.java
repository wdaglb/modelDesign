package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.Menu;
import org.apache.ibatis.annotations.Mapper;

/**
 * 后台菜单 Mapper。
 */
@Mapper
public interface MenuMapper extends BaseMapper<Menu> {
}
