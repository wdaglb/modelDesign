package io.github.modelDesign.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统消息推送任务 Mapper。
 */
@Mapper
public interface SystemMessagePushTaskMapper extends BaseMapper<SystemMessagePushTask> {
}
