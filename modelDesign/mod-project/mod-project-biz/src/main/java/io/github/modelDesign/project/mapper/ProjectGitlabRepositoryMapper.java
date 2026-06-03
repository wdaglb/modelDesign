package io.github.modelDesign.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.project.domain.ProjectGitlabRepository;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目 GitLab 仓库绑定 Mapper。
 */
@Mapper
public interface ProjectGitlabRepositoryMapper extends BaseMapper<ProjectGitlabRepository> {
}
