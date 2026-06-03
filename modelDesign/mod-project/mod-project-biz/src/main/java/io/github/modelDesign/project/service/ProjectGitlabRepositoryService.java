package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectGitlabRepository;
import io.github.modelDesign.project.mapper.ProjectGitlabRepositoryMapper;
import io.github.modelDesign.project.request.ProjectGitlabRepositoryBindRequest;
import io.github.modelDesign.project.response.ProjectGitlabRepositoryVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 项目 GitLab 仓库绑定服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectGitlabRepositoryService {
    /**
     * 项目 GitLab 仓库绑定 Mapper。
     */
    private final ProjectGitlabRepositoryMapper projectGitlabRepositoryMapper;

    /**
     * 按项目查询 GitLab 仓库绑定。
     *
     * @param tenantId  租户 ID
     * @param projectId 本地项目 ID
     * @return GitLab 仓库绑定列表
     */
    public List<ProjectGitlabRepositoryVo> listByProject(Long tenantId, Long projectId) {
        List<ProjectGitlabRepository> repositories = projectGitlabRepositoryMapper.selectList(
                buildProjectBindingQuery(tenantId, projectId)
        );
        if (repositories.isEmpty()) {
            return Collections.emptyList();
        }
        return repositories.stream().map(this::toVo).toList();
    }

    /**
     * 覆盖保存项目 GitLab 仓库绑定。
     *
     * @param tenantId     租户 ID
     * @param projectId    本地项目 ID
     * @param repositories 待保存的 GitLab 仓库快照列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveBindings(
            Long tenantId,
            Long projectId,
            List<ProjectGitlabRepositoryBindRequest> repositories
    ) {
        List<ProjectGitlabRepositoryBindRequest> normalizedRepositories = normalizeRepositories(repositories);
        projectGitlabRepositoryMapper.delete(buildProjectBindingQuery(tenantId, projectId));
        if (normalizedRepositories.isEmpty()) {
            return;
        }

        for (ProjectGitlabRepositoryBindRequest repository : normalizedRepositories) {
            ProjectGitlabRepository binding = new ProjectGitlabRepository();
            binding.setTenantId(tenantId);
            binding.setProjectId(projectId);
            binding.setGitlabProjectId(repository.getGitlabProjectId());
            binding.setName(repository.getName().trim());
            binding.setPathWithNamespace(repository.getPathWithNamespace().trim());
            binding.setWebUrl(repository.getWebUrl().trim());
            projectGitlabRepositoryMapper.insert(binding);
        }
    }

    /**
     * 清空项目 GitLab 仓库绑定。
     *
     * @param tenantId  租户 ID
     * @param projectId 本地项目 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void clearBindings(Long tenantId, Long projectId) {
        projectGitlabRepositoryMapper.delete(buildProjectBindingQuery(tenantId, projectId));
    }

    /**
     * 构建项目绑定查询条件。
     *
     * @param tenantId  租户 ID
     * @param projectId 本地项目 ID
     * @return MyBatis-Plus 查询条件
     */
    private LambdaQueryWrapper<ProjectGitlabRepository> buildProjectBindingQuery(Long tenantId, Long projectId) {
        return new LambdaQueryWrapper<ProjectGitlabRepository>()
                .eq(ProjectGitlabRepository::getTenantId, tenantId)
                .eq(ProjectGitlabRepository::getProjectId, projectId)
                .orderByAsc(ProjectGitlabRepository::getId);
    }

    /**
     * 规范化并校验绑定请求。
     *
     * @param repositories 原始绑定请求列表
     * @return 规范化后的请求列表
     */
    private List<ProjectGitlabRepositoryBindRequest> normalizeRepositories(
            List<ProjectGitlabRepositoryBindRequest> repositories
    ) {
        if (repositories == null || repositories.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> gitlabProjectIds = new LinkedHashSet<>();
        List<ProjectGitlabRepositoryBindRequest> normalizedRepositories = new ArrayList<>();
        for (ProjectGitlabRepositoryBindRequest repository : repositories) {
            validateRepository(repository);
            if (!gitlabProjectIds.add(repository.getGitlabProjectId())) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST.value(),
                        "不能重复绑定同一个 GitLab 仓库"
                );
            }
            normalizedRepositories.add(repository);
        }
        return normalizedRepositories;
    }

    /**
     * 校验单个 GitLab 仓库快照。
     *
     * @param repository 待校验的仓库快照
     */
    private void validateRepository(ProjectGitlabRepositoryBindRequest repository) {
        if (repository == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 仓库绑定不能为空");
        }
        if (repository.getGitlabProjectId() == null || repository.getGitlabProjectId() <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 项目 ID 不合法");
        }
        if (!StringUtils.hasText(repository.getName())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 项目名称不能为空");
        }
        if (!StringUtils.hasText(repository.getPathWithNamespace())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 完整命名空间路径不能为空");
        }
        if (!StringUtils.hasText(repository.getWebUrl())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 项目网页地址不能为空");
        }
    }

    private ProjectGitlabRepositoryVo toVo(ProjectGitlabRepository repository) {
        return ProjectGitlabRepositoryVo.builder()
                .gitlabProjectId(repository.getGitlabProjectId())
                .name(repository.getName())
                .pathWithNamespace(repository.getPathWithNamespace())
                .webUrl(repository.getWebUrl())
                .build();
    }
}
