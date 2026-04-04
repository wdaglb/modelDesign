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
 * 企业微信 OAuth 客户端。
 */
@Component
@RequiredArgsConstructor
public class QyworkOauthClient {
    private final OkHttpClient qyworkOkHttpClient;
    private final ObjectMapper objectMapper;
    private final QyworkProperties qyworkProperties;

    /**
     * 根据 OAuth code 获取企业微信成员身份。
     *
     * @param accessToken 当前租户 access token
     * @param code        OAuth code
     * @return 企业微信用户信息响应
     */
    public QyworkOauthUserInfoResponse getUserInfo(String accessToken, String code) {
        Request request = new Request.Builder()
                .url(buildRequestUrl(accessToken, code))
                .get()
                .build();
        try (Response response = qyworkOkHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信 OAuth 接口失败");
            }
            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信 OAuth 接口响应为空");
            }
            String body = responseBody.string();
            QyworkOauthUserInfoResponse userInfo = objectMapper.readValue(body, QyworkOauthUserInfoResponse.class);
            validateUserInfo(userInfo);
            return userInfo;
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "调用企业微信 OAuth 接口失败");
        }
    }

    private String buildRequestUrl(String accessToken, String code) {
        try {
            return UriComponentsBuilder.fromHttpUrl(qyworkProperties.getBaseUrl())
                    .path("/cgi-bin/user/getuserinfo")
                    .queryParam("access_token", accessToken)
                    .queryParam("code", code)
                    .build()
                    .toUriString();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "企业微信基础地址配置错误");
        }
    }

    private void validateUserInfo(QyworkOauthUserInfoResponse userInfo) {
        if (userInfo.getErrCode() != null && userInfo.getErrCode() != 0) {
            String message = "企业微信 OAuth 返回错误";
            if (StringUtils.hasText(userInfo.getErrMsg())) {
                message = message + "：" + userInfo.getErrMsg();
            }
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), message);
        }
        if (!StringUtils.hasText(userInfo.getUserId())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信未返回有效 UserId");
        }
    }
}
