package io.github.modelDesign.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.system.domain.SystemFileAccessConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件访问配置 Mapper。
 */
@Mapper
public interface SystemFileAccessConfigMapper
        extends BaseMapper<SystemFileAccessConfig> {
}
