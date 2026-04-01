package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.TaskStatusConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务状态配置 Mapper。
 */
@Mapper
public interface TaskStatusConfigMapper extends BaseMapper<TaskStatusConfig> {
}
