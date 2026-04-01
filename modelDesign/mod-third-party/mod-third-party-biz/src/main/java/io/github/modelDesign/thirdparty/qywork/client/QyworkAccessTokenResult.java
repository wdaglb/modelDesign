package io.github.modelDesign.thirdparty.qywork.client;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 企业微信 access token 结果。
 */
@Data
@AllArgsConstructor
public class QyworkAccessTokenResult {
    /**
     * access token。
     */
    private String accessToken;

    /**
     * 有效期秒数。
     */
    private Long expiresIn;
}
