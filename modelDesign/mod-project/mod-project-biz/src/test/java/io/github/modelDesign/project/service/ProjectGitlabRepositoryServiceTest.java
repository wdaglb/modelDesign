package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectGitlabRepository;
import io.github.modelDesign.project.mapper.ProjectGitlabRepositoryMapper;
import io.github.modelDesign.project.request.ProjectGitlabRepositoryBindRequest;
import io.github.modelDesign.project.response.ProjectGitlabRepositoryVo;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 项目 GitLab 仓库绑定服务测试。
 */
class ProjectGitlabRepositoryServiceTest {
    /**
     * 保存多个 GitLab 仓库时应保留租户、项目和快照字段。
     */
    @Test
    void saveBindingsShouldPersistMultipleRepositories() {
        ProjectGitlabRepositoryMapper mapper = mock(ProjectGitlabRepositoryMapper.class);
        ProjectGitlabRepositoryService service = new ProjectGitlabRepositoryService(mapper);
        List<ProjectGitlabRepository> insertedRepositories = new ArrayList<>();

        when(mapper.delete(any(Wrapper.class))).thenReturn(0);
        doAnswer(invocation -> {
            ProjectGitlabRepository repository = invocation.getArgument(0);
            repository.setId((long) (insertedRepositories.size() + 1));
            insertedRepositories.add(repository);
            return 1;
        }).when(mapper).insert(any(ProjectGitlabRepository.class));

        service.saveBindings(1001L, 88L, List.of(
                buildRequest(11L, "服务端", "group/server", "https://gitlab.example.com/group/server"),
                buildRequest(12L, "前端", "group/admin", "https://gitlab.example.com/group/admin")
        ));

        assertEquals(2, insertedRepositories.size());
        assertEquals(1001L, insertedRepositories.get(0).getTenantId());
        assertEquals(88L, insertedRepositories.get(0).getProjectId());
        assertEquals(11L, insertedRepositories.get(0).getGitlabProjectId());
        assertEquals("服务端", insertedRepositories.get(0).getName());
        assertEquals("group/server", insertedRepositories.get(0).getPathWithNamespace());
    }

    /**
     * 覆盖保存时应先清空当前租户当前项目的旧绑定。
     */
    @Test
    void saveBindingsShouldDeleteOldBindingsBeforeInsert() {
        ProjectGitlabRepositoryMapper mapper = mock(ProjectGitlabRepositoryMapper.class);
        ProjectGitlabRepositoryService service = new ProjectGitlabRepositoryService(mapper);
        List<ProjectGitlabRepository> storedRepositories = new ArrayList<>();
        storedRepositories.add(buildEntity(1001L, 88L, 10L));

        doAnswer(invocation -> {
            storedRepositories.clear();
            return 1;
        }).when(mapper).delete(any(Wrapper.class));
        doAnswer(invocation -> {
            ProjectGitlabRepository repository = invocation.getArgument(0);
            storedRepositories.add(repository);
            return 1;
        }).when(mapper).insert(any(ProjectGitlabRepository.class));

        service.saveBindings(1001L, 88L, List.of(
                buildRequest(99L, "新仓库", "group/new", "https://gitlab.example.com/group/new")
        ));

        assertEquals(1, storedRepositories.size());
        assertEquals(99L, storedRepositories.get(0).getGitlabProjectId());
    }

    /**
     * 空列表代表清空绑定，不能继续写入旧仓库快照。
     */
    @Test
    void saveBindingsShouldClearWhenRequestIsEmpty() {
        ProjectGitlabRepositoryMapper mapper = mock(ProjectGitlabRepositoryMapper.class);
        ProjectGitlabRepositoryService service = new ProjectGitlabRepositoryService(mapper);
        List<ProjectGitlabRepository> storedRepositories = new ArrayList<>();
        storedRepositories.add(buildEntity(1001L, 88L, 10L));

        doAnswer(invocation -> {
            storedRepositories.clear();
            return 1;
        }).when(mapper).delete(any(Wrapper.class));

        service.saveBindings(1001L, 88L, List.of());

        assertEquals(0, storedRepositories.size());
    }

    /**
     * 同一请求内重复 GitLab 项目 ID 会导致唯一约束冲突，应提前返回业务错误。
     */
    @Test
    void saveBindingsShouldRejectDuplicatedGitlabProjectId() {
        ProjectGitlabRepositoryMapper mapper = mock(ProjectGitlabRepositoryMapper.class);
        ProjectGitlabRepositoryService service = new ProjectGitlabRepositoryService(mapper);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.saveBindings(1001L, 88L, List.of(
                        buildRequest(11L, "服务端", "group/server", "https://gitlab.example.com/group/server"),
                        buildRequest(11L, "服务端副本", "group/server-copy", "https://gitlab.example.com/copy")
                ))
        );

        assertEquals("不能重复绑定同一个 GitLab 仓库", exception.getMessage());
    }

    /**
     * 读取绑定时应返回项目表单需要的快照字段。
     */
    @Test
    void listByProjectShouldReturnSnapshotFields() {
        ProjectGitlabRepositoryMapper mapper = mock(ProjectGitlabRepositoryMapper.class);
        ProjectGitlabRepositoryService service = new ProjectGitlabRepositoryService(mapper);
        when(mapper.selectList(any(Wrapper.class))).thenReturn(List.of(
                buildEntity(1001L, 88L, 11L)
        ));

        List<ProjectGitlabRepositoryVo> result = service.listByProject(1001L, 88L);

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).getGitlabProjectId());
        assertEquals("仓库-11", result.get(0).getName());
        assertEquals("group/repo-11", result.get(0).getPathWithNamespace());
        assertEquals("https://gitlab.example.com/group/repo-11", result.get(0).getWebUrl());
    }

    private ProjectGitlabRepositoryBindRequest buildRequest(
            Long gitlabProjectId,
            String name,
            String pathWithNamespace,
            String webUrl
    ) {
        ProjectGitlabRepositoryBindRequest request = new ProjectGitlabRepositoryBindRequest();
        request.setGitlabProjectId(gitlabProjectId);
        request.setName(name);
        request.setPathWithNamespace(pathWithNamespace);
        request.setWebUrl(webUrl);
        return request;
    }

    private ProjectGitlabRepository buildEntity(Long tenantId, Long projectId, Long gitlabProjectId) {
        ProjectGitlabRepository repository = new ProjectGitlabRepository();
        repository.setId(gitlabProjectId);
        repository.setTenantId(tenantId);
        repository.setProjectId(projectId);
        repository.setGitlabProjectId(gitlabProjectId);
        repository.setName("仓库-" + gitlabProjectId);
        repository.setPathWithNamespace("group/repo-" + gitlabProjectId);
        repository.setWebUrl("https://gitlab.example.com/group/repo-" + gitlabProjectId);
        return repository;
    }
}
