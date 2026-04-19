package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.TaskType;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务类型 Mapper。
 */
@Mapper
public interface TaskTypeMapper extends BaseMapper<TaskType> {
}
