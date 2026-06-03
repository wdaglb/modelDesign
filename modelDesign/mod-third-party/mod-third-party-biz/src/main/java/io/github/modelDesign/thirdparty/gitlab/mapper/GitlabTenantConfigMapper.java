package io.github.modelDesign.thirdparty.gitlab.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import io.github.modelDesign.thirdparty.gitlab.domain.GitlabTenantConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * GitLab 租户配置 Mapper。
 */
@Mapper
public interface GitlabTenantConfigMapper extends BaseMapper<GitlabTenantConfig> {
}
