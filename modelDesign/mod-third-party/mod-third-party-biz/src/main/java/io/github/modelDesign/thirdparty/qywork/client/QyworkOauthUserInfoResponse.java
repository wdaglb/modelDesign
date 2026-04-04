package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 企业微信 OAuth 用户信息响应。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class QyworkOauthUserInfoResponse {
    @JsonProperty("errcode")
    private Integer errCode;

    @JsonProperty("errmsg")
    private String errMsg;

    @JsonProperty("UserId")
    private String userId;

    @JsonProperty("OpenId")
    private String openId;
}
