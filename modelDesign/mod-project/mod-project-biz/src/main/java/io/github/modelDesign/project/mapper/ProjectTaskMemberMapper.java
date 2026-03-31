package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目任务成员 Mapper。
 */
@Mapper
public interface ProjectTaskMemberMapper extends BaseMapper<ProjectTaskMember> {
}
