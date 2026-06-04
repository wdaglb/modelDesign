package io.github.modelDesign.thirdparty.provider.gitlab.v4;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabCurrentUserResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * GitLab API v4 provider。
 */
public class GitlabV4ApiProvider implements GitlabApiProvider {
    /**
     * GitLab API v4 路径前缀。
     */
    private static final String API_V4_PREFIX = "/api/v4";

    /**
     * GitLab provider 编码。
     */
    private static final String PROVIDER_CODE = "gitlab-v4";

    /**
     * GitLab provider 版本。
     */
    private static final String PROVIDER_VERSION = "1.0.0";

    /**
     * provider 内部 HTTP 客户端。
     */
    private final OkHttpClient okHttpClient = new OkHttpClient.Builder()
            .connectTimeout(Duration.ofSeconds(10))
            .readTimeout(Duration.ofSeconds(15))
            .writeTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * JSON 对象映射器。
     */
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderCode() {
        return PROVIDER_CODE;
    }

    @Override
    public String getProviderVersion() {
        return PROVIDER_VERSION;
    }

    @Override
    public GitlabCurrentUserResult getCurrentUser(GitlabProviderContext context) {
        Request request = new Request.Builder()
                .url(buildApiUrl(context.getServerUrl(), "/user"))
                .get()
                .header("PRIVATE-TOKEN", context.getAccessToken())
                .build();
        GitlabV4CurrentUserResponse response = executeJson(
                request,
                GitlabV4CurrentUserResponse.class
        );
        return GitlabCurrentUserResult.builder()
                .id(response.getId())
                .username(response.getUsername())
                .name(response.getName())
                .webUrl(response.getWebUrl())
                .build();
    }

    @Override
    public GitlabProjectPageResult listProjects(
            GitlabProviderContext context,
            GitlabProjectQuery query
    ) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(buildApiUrl(context.getServerUrl(), "/projects"))
                .queryParam("page", query.getCurrent())
                .queryParam("per_page", query.getPageSize())
                .queryParam("simple", true)
                .queryParam("membership", true);
        if (StringUtils.hasText(query.getKeyword())) {
            builder.queryParam("search", query.getKeyword().trim());
        }
        Request request = new Request.Builder()
                .url(builder.build().toUriString())
                .get()
                .header("PRIVATE-TOKEN", context.getAccessToken())
                .build();
        return executeProjectList(request);
    }

    private GitlabProjectPageResult executeProjectList(Request request) {
        try (Response response = okHttpClient.newCall(request).execute()) {
            String body = requireResponseBody(response);
            validateResponse(response, body);
            List<GitlabV4ProjectResponse> projects = objectMapper.readValue(
                    body,
                    new TypeReference<>() {
                    }
            );
            List<GitlabProjectResult> items = projects.stream()
                    .map(this::toProjectResult)
                    .toList();
            return new GitlabProjectPageResult(items, parseTotal(response));
        } catch (GitlabProviderException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new GitlabProviderException("调用 GitLab 接口失败", exception);
        }
    }

    private <T> T executeJson(Request request, Class<T> responseType) {
        try (Response response = okHttpClient.newCall(request).execute()) {
            String body = requireResponseBody(response);
            validateResponse(response, body);
            return objectMapper.readValue(body, responseType);
        } catch (GitlabProviderException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new GitlabProviderException("调用 GitLab 接口失败", exception);
        }
    }

    private String buildApiUrl(String serverUrl, String path) {
        try {
            return UriComponentsBuilder.fromUriString(serverUrl)
                    .path(API_V4_PREFIX)
                    .path(path)
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new GitlabProviderException("GitLab 服务器地址配置错误", exception);
        }
    }

    private String requireResponseBody(Response response) throws IOException {
        ResponseBody responseBody = response.body();
        if (responseBody == null) {
            throw new GitlabProviderException("GitLab 接口响应为空");
        }
        return responseBody.string();
    }

    private void validateResponse(Response response, String body) {
        if (response.isSuccessful()) {
            return;
        }
        if (response.code() == 401 || response.code() == 403) {
            throw new GitlabProviderException("GitLab Token 无效或权限不足");
        }
        String message = "调用 GitLab 接口失败，状态码：" + response.code();
        if (StringUtils.hasText(body)) {
            message = message + "，响应摘要：" + summarizeBody(body);
        }
        throw new GitlabProviderException(message);
    }

    private Long parseTotal(Response response) {
        String total = response.header("X-Total");
        if (!StringUtils.hasText(total)) {
            return 0L;
        }
        try {
            return Long.parseLong(total);
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private GitlabProjectResult toProjectResult(GitlabV4ProjectResponse project) {
        return GitlabProjectResult.builder()
                .id(project.getId())
                .name(project.getName())
                .pathWithNamespace(project.getPathWithNamespace())
                .webUrl(project.getWebUrl())
                .visibility(project.getVisibility())
                .defaultBranch(project.getDefaultBranch())
                .lastActivityAt(project.getLastActivityAt())
                .build();
    }

    private String summarizeBody(String body) {
        String normalizedBody = body.replaceAll("\\s+", " ").trim();
        if (normalizedBody.length() <= 200) {
            return normalizedBody;
        }
        return normalizedBody.substring(0, 200);
    }
}
