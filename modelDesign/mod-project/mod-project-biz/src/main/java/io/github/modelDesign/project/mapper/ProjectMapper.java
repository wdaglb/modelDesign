package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.Project;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目 Mapper。
 */
@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
