package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 企业微信应用消息发送请求。
 *
 * <p>当前系统消息统一使用企业微信 markdown 应用消息，字段命名严格按企业微信
 * message/send 接口要求输出，避免和项目内部 camelCase 约定混淆。</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QyworkMessageSendRequest {
    /**
     * 企业微信成员 ID，多个成员可用竖线分隔。
     */
    @JsonProperty("touser")
    private String toUser;

    /**
     * 消息类型。
     */
    @JsonProperty("msgtype")
    private String msgType;

    /**
     * 企业微信应用 ID。
     */
    @JsonProperty("agentid")
    private Integer agentId;

    /**
     * Markdown 消息内容。
     */
    private Markdown markdown;

    /**
     * Markdown 消息体。
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Markdown {
        /**
         * Markdown 内容。
         */
        private String content;
    }
}
