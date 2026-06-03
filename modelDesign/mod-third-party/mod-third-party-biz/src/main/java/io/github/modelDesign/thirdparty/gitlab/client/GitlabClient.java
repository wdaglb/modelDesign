package io.github.modelDesign.thirdparty.gitlab.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.common.exception.BusinessException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

/**
 * GitLab API v4 客户端。
 */
@Component
public class GitlabClient {
    /**
     * GitLab API 版本路径。
     */
    private static final String API_V4_PREFIX = "/api/v4";

    /**
     * GitLab 专用 HTTP 客户端。
     */
    private final OkHttpClient gitlabOkHttpClient;

    /**
     * JSON 对象映射器。
     */
    private final ObjectMapper objectMapper;

    /**
     * 创建 GitLab 客户端。
     *
     * @param gitlabOkHttpClient GitLab 专用 HTTP 客户端
     * @param objectMapper       JSON 对象映射器
     */
    public GitlabClient(
            @Qualifier("gitlabOkHttpClient") OkHttpClient gitlabOkHttpClient,
            ObjectMapper objectMapper) {
        this.gitlabOkHttpClient = gitlabOkHttpClient;
        this.objectMapper = objectMapper;
    }

    /**
     * 获取当前 Token 对应的 GitLab 用户。
     *
     * @param serverUrl   GitLab 服务器地址
     * @param accessToken GitLab 访问 Token
     * @return 当前用户信息
     */
    public GitlabCurrentUserResponse getCurrentUser(String serverUrl, String accessToken) {
        Request request = new Request.Builder()
                .url(buildApiUrl(serverUrl, "/user"))
                .get()
                .header("PRIVATE-TOKEN", accessToken)
                .build();
        return executeJson(request, GitlabCurrentUserResponse.class);
    }

    /**
     * 查询 GitLab 项目列表。
     *
     * @param serverUrl   GitLab 服务器地址
     * @param accessToken GitLab 访问 Token
     * @param current     页码
     * @param pageSize    每页条数
     * @param keyword     搜索关键词
     * @return 项目分页结果
     */
    public GitlabProjectPageResult listProjects(
            String serverUrl,
            String accessToken,
            Integer current,
            Integer pageSize,
            String keyword) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(buildApiUrl(serverUrl, "/projects"))
                .queryParam("page", current)
                .queryParam("per_page", pageSize)
                .queryParam("simple", true)
                .queryParam("membership", true);
        if (StringUtils.hasText(keyword)) {
            builder.queryParam("search", keyword.trim());
        }
        Request request = new Request.Builder()
                .url(builder.build().toUriString())
                .get()
                .header("PRIVATE-TOKEN", accessToken)
                .build();
        return executeProjectList(request);
    }

    private GitlabProjectPageResult executeProjectList(Request request) {
        try (Response response = gitlabOkHttpClient.newCall(request).execute()) {
            String body = requireResponseBody(response);
            validateResponse(response, body);
            List<GitlabProjectResponse> projects = objectMapper.readValue(
                    body,
                    new TypeReference<>() {
                    }
            );
            return new GitlabProjectPageResult(projects, parseTotal(response));
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用 GitLab 接口失败");
        }
    }

    private <T> T executeJson(Request request, Class<T> responseType) {
        try (Response response = gitlabOkHttpClient.newCall(request).execute()) {
            String body = requireResponseBody(response);
            validateResponse(response, body);
            return objectMapper.readValue(body, responseType);
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用 GitLab 接口失败");
        }
    }

    private String buildApiUrl(String serverUrl, String path) {
        try {
            return UriComponentsBuilder.fromHttpUrl(serverUrl)
                    .path(API_V4_PREFIX)
                    .path(path)
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab 服务器地址配置错误");
        }
    }

    private String requireResponseBody(Response response) throws IOException {
        ResponseBody responseBody = response.body();
        if (responseBody == null) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "GitLab 接口响应为空");
        }
        return responseBody.string();
    }

    private void validateResponse(Response response, String body) {
        if (response.isSuccessful()) {
            return;
        }
        if (response.code() == HttpStatus.UNAUTHORIZED.value()
                || response.code() == HttpStatus.FORBIDDEN.value()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "GitLab Token 无效或权限不足");
        }
        String message = "调用 GitLab 接口失败，状态码：" + response.code();
        if (StringUtils.hasText(body)) {
            message = message + "，响应摘要：" + summarizeBody(body);
        }
        throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), message);
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

    private String summarizeBody(String body) {
        String normalizedBody = body.replaceAll("\\s+", " ").trim();
        if (normalizedBody.length() <= 200) {
            return normalizedBody;
        }
        return normalizedBody.substring(0, 200);
    }
}
