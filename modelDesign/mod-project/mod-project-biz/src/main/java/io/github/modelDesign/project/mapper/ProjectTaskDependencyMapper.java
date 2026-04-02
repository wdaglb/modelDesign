package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTaskDependency;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务前置依赖 Mapper。
 */
@Mapper
public interface ProjectTaskDependencyMapper extends BaseMapper<ProjectTaskDependency> {
}
