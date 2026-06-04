package io.github.modelDesign.thirdparty.gitlab.provider;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.gitlab.configuration.GitlabProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.ServiceLoader;
import java.util.concurrent.ConcurrentHashMap;

/**
 * GitLab provider jar 注册表。
 */
@Service
@RequiredArgsConstructor
public class GitlabProviderRegistry {
    /**
     * GitLab 模块配置。
     */
    private final GitlabProperties gitlabProperties;

    /**
     * provider 缓存。
     */
    private final Map<String, GitlabProviderHolder> holderCache = new ConcurrentHashMap<>();

    /**
     * provider 维度加载锁。
     */
    private final Map<String, Object> lockMap = new ConcurrentHashMap<>();

    /**
     * 获取指定 provider。
     *
     * @param providerCode    provider 编码
     * @param providerVersion provider 版本
     * @return GitLab API provider
     */
    public GitlabApiProvider getProvider(String providerCode, String providerVersion) {
        return getHolder(providerCode, providerVersion).getProvider();
    }

    /**
     * 获取 provider holder。
     *
     * @param providerCode    provider 编码
     * @param providerVersion provider 版本
     * @return provider holder
     */
    public GitlabProviderHolder getHolder(String providerCode, String providerVersion) {
        String normalizedCode = normalizeRequired(providerCode, "GitLab provider 编码不能为空");
        String normalizedVersion = normalizeRequired(providerVersion, "GitLab provider 版本不能为空");
        String cacheKey = buildCacheKey(normalizedCode, normalizedVersion);
        Object lock = lockMap.computeIfAbsent(cacheKey, key -> new Object());
        synchronized (lock) {
            GitlabProviderDescriptor descriptor = resolveDescriptor(
                    normalizedCode,
                    normalizedVersion
            );
            GitlabProviderHolder currentHolder = holderCache.get(cacheKey);
            if (currentHolder != null && isSameDescriptor(currentHolder, descriptor)) {
                return currentHolder;
            }
            GitlabProviderHolder nextHolder = loadHolder(descriptor);
            holderCache.put(cacheKey, nextHolder);
            return nextHolder;
        }
    }

    private GitlabProviderDescriptor resolveDescriptor(
            String providerCode,
            String providerVersion
    ) {
        Path providerPath = Paths.get(gitlabProperties.getProviderDir())
                .resolve(providerCode)
                .resolve(providerVersion);
        if (!Files.isDirectory(providerPath)) {
            throw providerError("GitLab provider jar 不存在：" + providerCode + "@" + providerVersion);
        }
        List<Path> jarPaths = listJarPaths(providerPath);
        if (jarPaths.isEmpty()) {
            throw providerError("GitLab provider jar 不存在：" + providerCode + "@" + providerVersion);
        }
        if (jarPaths.size() > 1) {
            throw providerError("GitLab provider jar 数量不唯一：" + providerCode + "@" + providerVersion);
        }
        Path jarPath = jarPaths.get(0);
        try {
            return GitlabProviderDescriptor.builder()
                    .providerCode(providerCode)
                    .providerVersion(providerVersion)
                    .jarPath(jarPath)
                    .size(Files.size(jarPath))
                    .lastModified(Files.getLastModifiedTime(jarPath).toMillis())
                    .hash(calculateSha256(jarPath))
                    .build();
        } catch (IOException exception) {
            throw providerError("GitLab provider jar 读取失败：" + providerCode + "@" + providerVersion);
        }
    }

    private List<Path> listJarPaths(Path providerPath) {
        try (var stream = Files.list(providerPath)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".jar"))
                    .sorted()
                    .toList();
        } catch (IOException exception) {
            return new ArrayList<>();
        }
    }

    private GitlabProviderHolder loadHolder(GitlabProviderDescriptor descriptor) {
        try {
            URL[] urls = new URL[]{descriptor.getJarPath().toUri().toURL()};
            URLClassLoader classLoader = new URLClassLoader(
                    urls,
                    GitlabApiProvider.class.getClassLoader()
            );
            GitlabApiProvider provider = loadProvider(classLoader, descriptor);
            return new GitlabProviderHolder(provider, classLoader, descriptor);
        } catch (IOException exception) {
            throw providerError("GitLab provider jar 加载失败：" + descriptor.getProviderCode());
        }
    }

    private GitlabApiProvider loadProvider(
            URLClassLoader classLoader,
            GitlabProviderDescriptor descriptor
    ) {
        ServiceLoader<GitlabApiProvider> loader = ServiceLoader.load(
                GitlabApiProvider.class,
                classLoader
        );
        List<GitlabApiProvider> providers = new ArrayList<>();
        loader.forEach(providers::add);
        if (providers.isEmpty()) {
            throw providerError("GitLab provider SPI 实现不存在：" + descriptor.getProviderCode());
        }
        if (providers.size() > 1) {
            throw providerError("GitLab provider SPI 实现数量不唯一：" + descriptor.getProviderCode());
        }
        GitlabApiProvider provider = providers.get(0);
        if (!descriptor.getProviderCode().equals(provider.getProviderCode())
                || !descriptor.getProviderVersion().equals(provider.getProviderVersion())) {
            throw providerError("GitLab provider code/version 不匹配：" + descriptor.getProviderCode());
        }
        return provider;
    }

    private boolean isSameDescriptor(
            GitlabProviderHolder holder,
            GitlabProviderDescriptor descriptor
    ) {
        GitlabProviderDescriptor current = holder.getDescriptor();
        return current.getJarPath().equals(descriptor.getJarPath())
                && current.getSize() == descriptor.getSize()
                && current.getLastModified() == descriptor.getLastModified()
                && current.getHash().equals(descriptor.getHash());
    }

    private String calculateSha256(Path jarPath) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream inputStream = Files.newInputStream(jarPath)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = inputStream.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IOException(exception);
        }
    }

    private String buildCacheKey(String providerCode, String providerVersion) {
        return providerCode + "@" + providerVersion;
    }

    private String normalizeRequired(String value, String message) {
        if (StringUtils.hasText(value)) {
            return value.trim();
        }
        throw providerError(message);
    }

    private BusinessException providerError(String message) {
        return new BusinessException(HttpStatus.BAD_GATEWAY.value(), message);
    }
}
