package io.github.modelDesign.thirdparty.gitlab.provider;

import lombok.Builder;
import lombok.Data;

import java.nio.file.Path;

/**
 * GitLab provider jar 描述信息。
 */
@Data
@Builder
public class GitlabProviderDescriptor {
    /**
     * provider 编码。
     */
    private String providerCode;

    /**
     * provider 版本。
     */
    private String providerVersion;

    /**
     * provider jar 路径。
     */
    private Path jarPath;

    /**
     * jar 文件大小。
     */
    private long size;

    /**
     * jar 文件最后修改时间。
     */
    private long lastModified;

    /**
     * jar 文件内容 hash。
     */
    private String hash;
}
