package io.github.modelDesign.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.system.domain.SystemMessageReadRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统消息已读记录 Mapper。
 */
@Mapper
public interface SystemMessageReadRecordMapper extends BaseMapper<SystemMessageReadRecord> {
}
