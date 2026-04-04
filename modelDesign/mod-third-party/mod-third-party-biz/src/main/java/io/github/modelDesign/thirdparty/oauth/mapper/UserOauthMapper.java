package io.github.modelDesign.thirdparty.oauth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.thirdparty.oauth.domain.UserOauth;
import org.apache.ibatis.annotations.Mapper;

/**
 * 第三方账号绑定 Mapper。
 */
@Mapper
public interface UserOauthMapper extends BaseMapper<UserOauth> {
}
