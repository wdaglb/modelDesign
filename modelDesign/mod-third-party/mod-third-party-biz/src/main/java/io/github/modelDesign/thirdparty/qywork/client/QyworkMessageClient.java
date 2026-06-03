package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import lombok.RequiredArgsConstructor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 企业微信应用消息客户端。
 */
@Component
@RequiredArgsConstructor
public class QyworkMessageClient {
    private static final MediaType JSON_MEDIA_TYPE = MediaType.get("application/json; charset=utf-8");

    /**
     * 企业微信 HTTP 客户端。
     */
    private final OkHttpClient qyworkOkHttpClient;

    /**
     * JSON 对象映射器。
     */
    private final ObjectMapper objectMapper;

    /**
     * 企业微信配置。
     */
    private final QyworkProperties qyworkProperties;

    /**
     * 发送企业微信应用消息。
     *
     * @param accessToken access token
     * @param request     发送请求
     */
    public void sendMessage(String accessToken, QyworkMessageSendRequest request) {
        validateRequest(accessToken, request);
        try {
            String requestBody = objectMapper.writeValueAsString(request);
            Request httpRequest = new Request.Builder()
                    .url(buildRequestUrl(accessToken))
                    .post(RequestBody.create(requestBody, JSON_MEDIA_TYPE))
                    .build();
            executeSend(httpRequest);
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信消息接口失败");
        }
    }

    private void executeSend(Request request) throws IOException {
        try (Response response = qyworkOkHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信消息接口失败");
            }
            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信消息接口响应为空");
            }
            QyworkMessageSendResponse sendResponse = objectMapper.readValue(
                    responseBody.string(),
                    QyworkMessageSendResponse.class
            );
            validateResponse(sendResponse);
        }
    }

    private String buildRequestUrl(String accessToken) {
        try {
            return UriComponentsBuilder.fromHttpUrl(qyworkProperties.getBaseUrl())
                    .path("/cgi-bin/message/send")
                    .queryParam("access_token", accessToken)
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "企业微信基础地址配置错误");
        }
    }

    private void validateRequest(String accessToken, QyworkMessageSendRequest request) {
        if (!StringUtils.hasText(accessToken)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信 access_token 不能为空");
        }
        if (request == null || !StringUtils.hasText(request.getToUser())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信消息接收人不能为空");
        }
        if (request.getAgentId() == null || request.getAgentId() <= 0) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信应用 ID 无效");
        }
        if (!StringUtils.hasText(request.getMsgType())
                || request.getMarkdown() == null
                || !StringUtils.hasText(request.getMarkdown().getContent())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信 Markdown 消息内容不能为空");
        }
    }

    private void validateResponse(QyworkMessageSendResponse response) {
        if (response == null) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信消息接口响应为空");
        }
        if (response.getErrCode() != null && response.getErrCode() == 0) {
            return;
        }
        throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), buildFailureMessage(response));
    }

    private String buildFailureMessage(QyworkMessageSendResponse response) {
        String message = "企业微信消息发送失败";
        if (response.getErrCode() != null) {
            message = message + "，errcode=" + response.getErrCode();
        }
        if (StringUtils.hasText(response.getErrMsg())) {
            message = message + "，errmsg=" + response.getErrMsg();
        }
        List<String> invalidReceivers = new ArrayList<>();
        appendInvalidReceiver(invalidReceivers, "invaliduser", response.getInvalidUser());
        appendInvalidReceiver(invalidReceivers, "invalidparty", response.getInvalidParty());
        appendInvalidReceiver(invalidReceivers, "invalidtag", response.getInvalidTag());
        appendInvalidReceiver(invalidReceivers, "unlicenseduser", response.getUnlicensedUser());
        if (!invalidReceivers.isEmpty()) {
            message = message + "，" + String.join("，", invalidReceivers);
        }
        return message;
    }

    private void appendInvalidReceiver(List<String> invalidReceivers, String fieldName, String fieldValue) {
        if (StringUtils.hasText(fieldValue)) {
            invalidReceivers.add(fieldName + "=" + fieldValue);
        }
    }
}
