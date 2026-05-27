package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.TaskIteration;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务迭代 Mapper。
 */
@Mapper
public interface TaskIterationMapper extends BaseMapper<TaskIteration> {
}
