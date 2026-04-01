package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 企业微信 access token 响应。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class QyworkAccessTokenResponse {
    /**
     * 错误码。
     */
    @JsonProperty("errcode")
    private Integer errCode;

    /**
     * 错误信息。
     */
    @JsonProperty("errmsg")
    private String errMsg;

    /**
     * access token。
     */
    @JsonProperty("access_token")
    private String accessToken;

    /**
     * 有效期秒数。
     */
    @JsonProperty("expires_in")
    private Long expiresIn;
}
