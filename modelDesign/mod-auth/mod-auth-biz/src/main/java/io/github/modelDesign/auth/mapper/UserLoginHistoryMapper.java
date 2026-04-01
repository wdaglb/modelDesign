package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.UserLoginHistory;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户登录历史 Mapper。
 */
@Mapper
public interface UserLoginHistoryMapper extends BaseMapper<UserLoginHistory> {
}
