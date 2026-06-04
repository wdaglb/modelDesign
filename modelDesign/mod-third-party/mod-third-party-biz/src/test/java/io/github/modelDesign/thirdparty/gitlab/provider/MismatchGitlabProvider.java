package io.github.modelDesign.thirdparty.gitlab.provider;

import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabCurrentUserResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;

/**
 * provider registry 测试用不匹配 provider。
 */
public class MismatchGitlabProvider implements GitlabApiProvider {
    @Override
    public String getProviderCode() {
        return "other-provider";
    }

    @Override
    public String getProviderVersion() {
        return "9.9.9";
    }

    @Override
    public GitlabCurrentUserResult getCurrentUser(GitlabProviderContext context) {
        return GitlabCurrentUserResult.builder().username("mismatch").build();
    }

    @Override
    public GitlabProjectPageResult listProjects(
            GitlabProviderContext context,
            GitlabProjectQuery query
    ) {
        return new GitlabProjectPageResult();
    }
}
