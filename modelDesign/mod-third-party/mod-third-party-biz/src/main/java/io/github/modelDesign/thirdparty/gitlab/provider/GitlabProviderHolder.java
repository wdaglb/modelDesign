package io.github.modelDesign.thirdparty.gitlab.provider;

import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.net.URLClassLoader;

/**
 * GitLab provider 持有对象。
 */
@Data
@AllArgsConstructor
public class GitlabProviderHolder {
    /**
     * provider 实例。
     */
    private GitlabApiProvider provider;

    /**
     * provider 独立类加载器。
     */
    private URLClassLoader classLoader;

    /**
     * provider jar 描述信息。
     */
    private GitlabProviderDescriptor descriptor;
}
