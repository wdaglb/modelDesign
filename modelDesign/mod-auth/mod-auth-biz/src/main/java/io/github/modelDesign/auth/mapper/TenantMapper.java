package io.github.modelDesign.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.auth.domain.Tenant;
import org.apache.ibatis.annotations.Mapper;

/**
 * 租户 Mapper。
 */
@Mapper
public interface TenantMapper extends BaseMapper<Tenant> {
}
