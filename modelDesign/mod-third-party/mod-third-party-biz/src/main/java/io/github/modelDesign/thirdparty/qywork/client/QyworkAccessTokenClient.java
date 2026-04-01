package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import lombok.RequiredArgsConstructor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * 企业微信 access token 客户端。
 */
@Component
@RequiredArgsConstructor
public class QyworkAccessTokenClient {
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
     * 调用企业微信接口获取 access token。
     *
     * @param corpId     corpId
     * @param corpSecret corpSecret
     * @return access token 结果
     */
    public QyworkAccessTokenResult getAccessToken(String corpId, String corpSecret) {
        Request request = new Request.Builder()
                .url(buildRequestUrl(corpId, corpSecret))
                .get()
                .build();
        try (Response response = qyworkOkHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信接口失败");
            }
            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信接口响应为空");
            }
            String body = responseBody.string();
            QyworkAccessTokenResponse tokenResponse = objectMapper.readValue(body, QyworkAccessTokenResponse.class);
            validateTokenResponse(tokenResponse);
            return new QyworkAccessTokenResult(tokenResponse.getAccessToken(), tokenResponse.getExpiresIn());
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信接口失败");
        }
    }

    private String buildRequestUrl(String corpId, String corpSecret) {
        try {
            return UriComponentsBuilder.fromHttpUrl(qyworkProperties.getBaseUrl())
                    .path("/cgi-bin/gettoken")
                    .queryParam("corpid", corpId)
                    .queryParam("corpsecret", corpSecret)
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "企业微信基础地址配置错误");
        }
    }

    private void validateTokenResponse(QyworkAccessTokenResponse tokenResponse) {
        if (tokenResponse.getErrCode() != null && tokenResponse.getErrCode() != 0) {
            String message = "调用企业微信接口失败";
            if (StringUtils.hasText(tokenResponse.getErrMsg())) {
                message = message + "：" + tokenResponse.getErrMsg();
            }
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), message);
        }
        if (!StringUtils.hasText(tokenResponse.getAccessToken())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信接口未返回有效 access_token");
        }
        if (tokenResponse.getExpiresIn() == null || tokenResponse.getExpiresIn() <= 0) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信接口未返回有效 expires_in");
        }
    }
}
