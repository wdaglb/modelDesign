package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTaskChangeLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务变更日志 Mapper。
 */
@Mapper
public interface ProjectTaskChangeLogMapper extends BaseMapper<ProjectTaskChangeLog> {
}
