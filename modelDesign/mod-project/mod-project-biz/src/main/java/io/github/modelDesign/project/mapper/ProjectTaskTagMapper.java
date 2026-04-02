package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTaskTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务标签绑定 Mapper。
 */
@Mapper
public interface ProjectTaskTagMapper extends BaseMapper<ProjectTaskTag> {
}
