package io.github.modelDesign.thirdparty.gitlab.provider;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.gitlab.configuration.GitlabProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * GitLab provider registry 测试。
 */
class GitlabProviderRegistryTest {
    /**
     * 首次调用时应按 providerCode/providerVersion 加载预置 jar。
     */
    @Test
    void getHolderShouldLoadProviderJar(@TempDir Path tempDir) throws IOException {
        writeProviderJar(tempDir, TestGitlabProvider.class.getName(), "v1");
        GitlabProviderRegistry registry = buildRegistry(tempDir);

        GitlabProviderHolder holder = registry.getHolder("gitlab-v4", "1.0.0");

        assertSame(TestGitlabProvider.class, holder.getProvider().getClass());
    }

    /**
     * jar 文件内容变化后应加载新 holder，旧 holder 不被强制替换。
     */
    @Test
    void getHolderShouldReloadWhenJarChanged(@TempDir Path tempDir) throws Exception {
        Path jarPath = writeProviderJar(tempDir, TestGitlabProvider.class.getName(), "v1");
        GitlabProviderRegistry registry = buildRegistry(tempDir);
        GitlabProviderHolder firstHolder = registry.getHolder("gitlab-v4", "1.0.0");

        Thread.sleep(5L);
        Files.delete(jarPath);
        writeProviderJar(tempDir, TestGitlabProvider.class.getName(), "v2");
        GitlabProviderHolder secondHolder = registry.getHolder("gitlab-v4", "1.0.0");

        assertNotSame(firstHolder, secondHolder);
        assertSame(TestGitlabProvider.class, firstHolder.getProvider().getClass());
        assertSame(TestGitlabProvider.class, secondHolder.getProvider().getClass());
    }

    /**
     * provider jar 缺失时应返回业务错误，不影响服务启动。
     */
    @Test
    void getHolderShouldThrowWhenJarMissing(@TempDir Path tempDir) {
        GitlabProviderRegistry registry = buildRegistry(tempDir);

        assertThrows(
                BusinessException.class,
                () -> registry.getHolder("gitlab-v4", "1.0.0")
        );
    }

    /**
     * provider 自声明 code/version 与租户配置不一致时应拒绝加载。
     */
    @Test
    void getHolderShouldThrowWhenProviderMetadataMismatch(@TempDir Path tempDir)
            throws IOException {
        writeProviderJar(tempDir, MismatchGitlabProvider.class.getName(), "bad");
        GitlabProviderRegistry registry = buildRegistry(tempDir);

        assertThrows(
                BusinessException.class,
                () -> registry.getHolder("gitlab-v4", "1.0.0")
        );
    }

    private GitlabProviderRegistry buildRegistry(Path tempDir) {
        GitlabProperties properties = new GitlabProperties();
        properties.setProviderDir(tempDir.toString());
        return new GitlabProviderRegistry(properties);
    }

    private Path writeProviderJar(
            Path providerDir,
            String providerClassName,
            String marker
    ) throws IOException {
        Path targetDir = providerDir.resolve("gitlab-v4").resolve("1.0.0");
        Files.createDirectories(targetDir);
        Path jarPath = targetDir.resolve("provider.jar");
        try (JarOutputStream outputStream = new JarOutputStream(Files.newOutputStream(jarPath))) {
            outputStream.putNextEntry(new JarEntry(
                    "META-INF/services/io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider"
            ));
            outputStream.write(providerClassName.getBytes(StandardCharsets.UTF_8));
            outputStream.closeEntry();
            outputStream.putNextEntry(new JarEntry("marker-" + marker + ".txt"));
            outputStream.write(marker.getBytes(StandardCharsets.UTF_8));
            outputStream.closeEntry();
        }
        return jarPath;
    }
}
