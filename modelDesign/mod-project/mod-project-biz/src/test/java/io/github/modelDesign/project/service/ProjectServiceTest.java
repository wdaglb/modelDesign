package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.request.ProjectCreateRequest;
import io.github.modelDesign.project.request.ProjectEditRequest;
import io.github.modelDesign.project.request.ProjectGitlabRepositoryBindRequest;
import io.github.modelDesign.project.response.ProjectDetailVo;
import io.github.modelDesign.project.response.ProjectGitlabRepositoryVo;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 项目服务测试。
 */
class ProjectServiceTest {
    /**
     * 创建项目时应在同一租户下保存 GitLab 仓库绑定。
     */
    @Test
    void createShouldSaveGitlabRepositoryBindings() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectGitlabRepositoryService gitlabRepositoryService = mock(ProjectGitlabRepositoryService.class);
        ProjectService service = buildService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                gitlabRepositoryService
        );
        ProjectCreateRequest request = buildCreateRequest();
        request.setGitlabRepositories(List.of(
                buildBindRequest(11L, "服务端", "group/server", "https://gitlab.example.com/group/server")
        ));

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .tenantId(1001L)
                .userId(7L)
                .nickname("管理员")
                .build());
        when(projectMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            Project project = invocation.getArgument(0);
            project.setId(88L);
            return 1;
        }).when(projectMapper).insert(any(Project.class));
        when(gitlabRepositoryService.listByProject(1001L, 88L)).thenReturn(List.of(
                ProjectGitlabRepositoryVo.builder()
                        .gitlabProjectId(11L)
                        .name("服务端")
                        .pathWithNamespace("group/server")
                        .webUrl("https://gitlab.example.com/group/server")
                        .build()
        ));

        ProjectDetailVo result = service.create(request);

        verify(gitlabRepositoryService).saveBindings(eq(1001L), eq(88L), eq(request.getGitlabRepositories()));
        assertEquals(88L, result.getId());
        assertEquals(1, result.getGitlabRepositories().size());
        assertEquals(11L, result.getGitlabRepositories().get(0).getGitlabProjectId());
    }

    /**
     * 编辑项目时应覆盖保存 GitLab 仓库绑定。
     */
    @Test
    void editShouldOverwriteGitlabRepositoryBindings() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectGitlabRepositoryService gitlabRepositoryService = mock(ProjectGitlabRepositoryService.class);
        ProjectService service = buildService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                gitlabRepositoryService
        );
        Project project = buildProject();
        ProjectEditRequest request = buildEditRequest();
        request.setGitlabRepositories(List.of(
                buildBindRequest(22L, "前端", "group/admin", "https://gitlab.example.com/group/admin")
        ));

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .tenantId(1001L)
                .userId(7L)
                .build());
        when(authUserApi.getUserMapByIds(any())).thenReturn(Map.of(
                7L,
                AuthUserSimpleDto.builder().id(7L).nickname("管理员").build()
        ));
        when(projectMapper.selectOne(any())).thenReturn(project);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);
        when(gitlabRepositoryService.listByProject(1001L, 88L)).thenReturn(List.of(
                ProjectGitlabRepositoryVo.builder()
                        .gitlabProjectId(22L)
                        .name("前端")
                        .pathWithNamespace("group/admin")
                        .webUrl("https://gitlab.example.com/group/admin")
                        .build()
        ));

        ProjectDetailVo result = service.edit(88L, request);

        verify(gitlabRepositoryService).saveBindings(eq(1001L), eq(88L), eq(request.getGitlabRepositories()));
        assertEquals("新项目", result.getName());
        assertEquals(1, result.getGitlabRepositories().size());
        assertEquals(22L, result.getGitlabRepositories().get(0).getGitlabProjectId());
    }

    /**
     * 编辑项目传空绑定列表时应清空 GitLab 仓库绑定。
     */
    @Test
    void editShouldClearGitlabRepositoryBindings() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectGitlabRepositoryService gitlabRepositoryService = mock(ProjectGitlabRepositoryService.class);
        ProjectService service = buildService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                gitlabRepositoryService
        );
        ProjectEditRequest request = buildEditRequest();
        request.setGitlabRepositories(Collections.emptyList());

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .tenantId(1001L)
                .userId(7L)
                .build());
        when(authUserApi.getUserMapByIds(any())).thenReturn(Collections.emptyMap());
        when(projectMapper.selectOne(any())).thenReturn(buildProject());
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);
        when(gitlabRepositoryService.listByProject(1001L, 88L)).thenReturn(Collections.emptyList());

        ProjectDetailVo result = service.edit(88L, request);

        verify(gitlabRepositoryService).saveBindings(eq(1001L), eq(88L), eq(Collections.emptyList()));
        assertEquals(0, result.getGitlabRepositories().size());
    }

    /**
     * 编辑项目不提交 GitLab 绑定字段时，应保留已有绑定关系不变。
     */
    @Test
    void editShouldKeepGitlabRepositoryBindingsWhenFieldMissing() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectGitlabRepositoryService gitlabRepositoryService = mock(ProjectGitlabRepositoryService.class);
        ProjectService service = buildService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                gitlabRepositoryService
        );
        ProjectEditRequest request = buildEditRequest();
        request.setGitlabRepositories(null);

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .tenantId(1001L)
                .userId(7L)
                .build());
        when(authUserApi.getUserMapByIds(any())).thenReturn(Collections.emptyMap());
        when(projectMapper.selectOne(any())).thenReturn(buildProject());
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);
        when(gitlabRepositoryService.listByProject(1001L, 88L)).thenReturn(List.of(
                ProjectGitlabRepositoryVo.builder()
                        .gitlabProjectId(11L)
                        .name("服务端")
                        .pathWithNamespace("group/server")
                        .webUrl("https://gitlab.example.com/group/server")
                        .build()
        ));

        ProjectDetailVo result = service.edit(88L, request);

        verify(gitlabRepositoryService, never()).saveBindings(any(), any(), any());
        assertEquals(1, result.getGitlabRepositories().size());
        assertEquals(11L, result.getGitlabRepositories().get(0).getGitlabProjectId());
    }

    /**
     * 项目详情应回显已绑定的 GitLab 仓库。
     */
    @Test
    void getDetailShouldReturnGitlabRepositoryBindings() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectGitlabRepositoryService gitlabRepositoryService = mock(ProjectGitlabRepositoryService.class);
        ProjectService service = buildService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                gitlabRepositoryService
        );

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .tenantId(1001L)
                .userId(7L)
                .build());
        when(authUserApi.getUserMapByIds(any())).thenReturn(Collections.emptyMap());
        when(projectMapper.selectOne(any())).thenReturn(buildProject());
        when(gitlabRepositoryService.listByProject(1001L, 88L)).thenReturn(List.of(
                ProjectGitlabRepositoryVo.builder()
                        .gitlabProjectId(33L)
                        .name("文档")
                        .pathWithNamespace("group/docs")
                        .webUrl("https://gitlab.example.com/group/docs")
                        .build()
        ));

        ProjectDetailVo result = service.getDetail(88L);

        assertEquals(1, result.getGitlabRepositories().size());
        assertEquals(33L, result.getGitlabRepositories().get(0).getGitlabProjectId());
    }

    private ProjectService buildService(
            AuthCurrentUserApi authCurrentUserApi,
            AuthUserApi authUserApi,
            ProjectMapper projectMapper,
            ProjectGitlabRepositoryService gitlabRepositoryService
    ) {
        ProjectService service = new ProjectService(
                authCurrentUserApi,
                authUserApi,
                gitlabRepositoryService
        );
        /**
         * ServiceImpl 的链式查询和 save/updateById 都依赖 baseMapper，
         * 单元测试中注入 mock mapper 才能覆盖真实服务路径。
         */
        ReflectionTestUtils.setField(service, "baseMapper", projectMapper);
        ReflectionTestUtils.setField(service, "mapperClass", ProjectMapper.class);
        ReflectionTestUtils.setField(service, "entityClass", Project.class);
        return service;
    }

    private ProjectCreateRequest buildCreateRequest() {
        ProjectCreateRequest request = new ProjectCreateRequest();
        request.setCode("demo");
        request.setName("演示项目");
        request.setDescription("项目说明");
        request.setDbType("postgresql");
        request.setStatus("planning");
        request.setProjectGroup("默认分组");
        request.setProgressSummary("初始化");
        request.setCompletedModuleCount(0);
        return request;
    }

    private ProjectEditRequest buildEditRequest() {
        ProjectEditRequest request = new ProjectEditRequest();
        request.setName("新项目");
        request.setDescription("新说明");
        request.setDbType("postgresql");
        request.setStatus("inProgress");
        request.setProjectGroup("默认分组");
        request.setProgressSummary("开发中");
        request.setCompletedModuleCount(1);
        return request;
    }

    private ProjectGitlabRepositoryBindRequest buildBindRequest(
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

    private Project buildProject() {
        Project project = new Project();
        project.setId(88L);
        project.setTenantId(1001L);
        project.setCreatorId(7L);
        project.setCode("demo");
        project.setName("演示项目");
        project.setDescription("项目说明");
        project.setDbType("postgresql");
        project.setStatus("planning");
        project.setProjectGroup("默认分组");
        project.setProgressSummary("初始化");
        project.setCompletedModuleCount(0);
        project.setDeleted(0);
        return project;
    }
}
