package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTaskDynamic;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务动态 Mapper。
 */
@Mapper
public interface ProjectTaskDynamicMapper extends BaseMapper<ProjectTaskDynamic> {
}
