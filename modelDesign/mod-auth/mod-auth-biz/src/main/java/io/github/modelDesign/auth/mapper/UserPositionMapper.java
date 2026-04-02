package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.UserPosition;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户职位关系 Mapper。
 */
@Mapper
public interface UserPositionMapper extends BaseMapper<UserPosition> {
}
