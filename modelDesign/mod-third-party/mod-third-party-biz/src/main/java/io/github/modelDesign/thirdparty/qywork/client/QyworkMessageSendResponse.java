package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 企业微信应用消息发送响应。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class QyworkMessageSendResponse {
    /**
     * 错误码，0 表示成功。
     */
    @JsonProperty("errcode")
    private Integer errCode;

    /**
     * 错误信息。
     */
    @JsonProperty("errmsg")
    private String errMsg;

    /**
     * 无效成员 ID 列表。
     */
    @JsonProperty("invaliduser")
    private String invalidUser;

    /**
     * 无效部门 ID 列表。
     */
    @JsonProperty("invalidparty")
    private String invalidParty;

    /**
     * 无效标签 ID 列表。
     */
    @JsonProperty("invalidtag")
    private String invalidTag;

    /**
     * 没有基础接口许可或互通权限的成员 ID 列表。
     */
    @JsonProperty("unlicenseduser")
    private String unlicensedUser;

    /**
     * 消息 ID。
     */
    @JsonProperty("msgid")
    private String msgId;
}
