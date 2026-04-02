package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.TaskTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务标签 Mapper。
 */
@Mapper
public interface TaskTagMapper extends BaseMapper<TaskTag> {
}
