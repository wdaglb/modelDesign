package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTask;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目任务 Mapper。
 */
@Mapper
public interface ProjectTaskMapper extends BaseMapper<ProjectTask> {
}
