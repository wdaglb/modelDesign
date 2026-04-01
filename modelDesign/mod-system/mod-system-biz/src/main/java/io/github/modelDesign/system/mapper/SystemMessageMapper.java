package io.github.modelDesign.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.system.domain.SystemMessage;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统消息 Mapper。
 */
@Mapper
public interface SystemMessageMapper extends BaseMapper<SystemMessage> {
}
