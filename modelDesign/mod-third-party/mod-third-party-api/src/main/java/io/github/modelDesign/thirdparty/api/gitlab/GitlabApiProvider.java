package io.github.modelDesign.thirdparty.api.gitlab;

/**
 * GitLab API provider SPI。
 *
 * <p>外部 provider jar 只需要依赖 mod-third-party-api 并实现该接口，
 * 主系统通过 provider 编码和版本动态选择具体实现。</p>
 */
public interface GitlabApiProvider {
    /**
     * 获取 provider 编码。
     *
     * @return provider 编码，例如 gitlab-v4
     */
    String getProviderCode();

    /**
     * 获取 provider 版本。
     *
     * @return provider 版本，例如 1.0.0
     */
    String getProviderVersion();

    /**
     * 获取当前 Token 对应的 GitLab 用户。
     *
     * @param context GitLab provider 调用上下文
     * @return GitLab 当前用户信息
     * @throws GitlabProviderException GitLab 外部接口或 provider 内部调用失败
     */
    GitlabCurrentUserResult getCurrentUser(GitlabProviderContext context);

    /**
     * 查询 GitLab 项目列表。
     *
     * @param context GitLab provider 调用上下文
     * @param query   项目列表查询条件
     * @return GitLab 项目分页结果
     * @throws GitlabProviderException GitLab 外部接口或 provider 内部调用失败
     */
    GitlabProjectPageResult listProjects(
            GitlabProviderContext context,
            GitlabProjectQuery query
    );
}
