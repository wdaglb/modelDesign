package io.github.modelDesign.thirdparty.provider.gitlab.v4;

import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderException;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * GitLab v4 provider 测试。
 */
class GitlabV4ApiProviderTest {
    /**
     * 测试连接使用 `/api/v4/user`，并通过 PRIVATE-TOKEN 头传递密钥。
     */
    @Test
    void getCurrentUserShouldCallUserEndpointWithPrivateToken()
            throws IOException, InterruptedException {
        try (MockWebServer server = new MockWebServer()) {
            server.enqueue(new MockResponse()
                    .setBody("""
                            {
                              "id": 1,
                              "username": "alice",
                              "name": "Alice",
                              "web_url": "https://gitlab/u/alice"
                            }
                            """));
            GitlabV4ApiProvider provider = new GitlabV4ApiProvider();

            var response = provider.getCurrentUser(context(server, "token-1"));

            assertEquals("alice", response.getUsername());
            RecordedRequest request = server.takeRequest();
            assertEquals("/api/v4/user", request.getPath());
            assertEquals("token-1", request.getHeader("PRIVATE-TOKEN"));
        }
    }

    /**
     * 项目列表需要解析 GitLab 分页总数和项目基础字段。
     */
    @Test
    void listProjectsShouldParseProjectListAndTotalHeader()
            throws IOException, InterruptedException {
        try (MockWebServer server = new MockWebServer()) {
            server.enqueue(new MockResponse()
                    .setHeader("X-Total", "1")
                    .setBody("""
                            [
                              {
                                "id": 10,
                                "name": "demo",
                                "path_with_namespace": "team/demo",
                                "web_url": "https://gitlab/team/demo",
                                "visibility": "private",
                                "default_branch": "main",
                                "last_activity_at": "2026-06-03T00:00:00Z"
                              }
                            ]
                            """));
            GitlabV4ApiProvider provider = new GitlabV4ApiProvider();

            GitlabProjectPageResult result = provider.listProjects(
                    context(server, "token-1"),
                    GitlabProjectQuery.builder()
                            .current(1)
                            .pageSize(20)
                            .keyword("demo")
                            .build()
            );

            assertEquals(1L, result.getTotal());
            assertEquals("team/demo", result.getItems().get(0).getPathWithNamespace());
            String path = server.takeRequest().getPath();
            assertTrue(path.startsWith("/api/v4/projects"));
            assertTrue(path.contains("search=demo"));
        }
    }

    /**
     * GitLab 鉴权失败时不暴露 Token，只返回统一 provider 异常。
     */
    @Test
    void getCurrentUserShouldThrowWhenUnauthorized() throws IOException {
        try (MockWebServer server = new MockWebServer()) {
            server.enqueue(new MockResponse()
                    .setResponseCode(401)
                    .setBody("{\"message\":\"401 Unauthorized\"}"));
            GitlabV4ApiProvider provider = new GitlabV4ApiProvider();

            assertThrows(
                    GitlabProviderException.class,
                    () -> provider.getCurrentUser(context(server, "token-1"))
            );
        }
    }

    private GitlabProviderContext context(MockWebServer server, String accessToken) {
        return GitlabProviderContext.builder()
                .serverUrl(server.url("/").toString())
                .accessToken(accessToken)
                .build();
    }
}
