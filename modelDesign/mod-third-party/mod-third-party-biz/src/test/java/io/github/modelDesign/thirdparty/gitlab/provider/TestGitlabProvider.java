package io.github.modelDesign.thirdparty.gitlab.provider;

import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabCurrentUserResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;

/**
 * provider registry 测试用 GitLab provider。
 */
public class TestGitlabProvider implements GitlabApiProvider {
    @Override
    public String getProviderCode() {
        return "gitlab-v4";
    }

    @Override
    public String getProviderVersion() {
        return "1.0.0";
    }

    @Override
    public GitlabCurrentUserResult getCurrentUser(GitlabProviderContext context) {
        return GitlabCurrentUserResult.builder().username("test").build();
    }

    @Override
    public GitlabProjectPageResult listProjects(
            GitlabProviderContext context,
            GitlabProjectQuery query
    ) {
        return new GitlabProjectPageResult();
    }
}
