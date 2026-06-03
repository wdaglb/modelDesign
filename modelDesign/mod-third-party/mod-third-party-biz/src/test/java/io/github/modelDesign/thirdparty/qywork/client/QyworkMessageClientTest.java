package io.github.modelDesign.thirdparty.qywork.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.qywork.configuration.QyworkProperties;
import okhttp3.OkHttpClient;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 企业微信应用消息客户端测试。
 */
class QyworkMessageClientTest {
    /**
     * errcode 为 0 时表示企业微信消息发送成功。
     */
    @Test
    void sendMessageShouldAcceptSuccessResponse() throws IOException {
        try (MockWebServer server = new MockWebServer()) {
            server.enqueue(new MockResponse().setBody("{\"errcode\":0,\"errmsg\":\"ok\"}"));
            QyworkMessageClient client = buildClient(server);

            client.sendMessage("token-1", request());
        }
    }

    /**
     * 企业微信返回非 0 errcode 时必须抛异常，交给上层推送任务重试。
     */
    @Test
    void sendMessageShouldThrowWhenErrCodeIsNotZero() throws IOException {
        try (MockWebServer server = new MockWebServer()) {
            server.enqueue(new MockResponse().setBody("{\"errcode\":40003,\"errmsg\":\"invalid user\",\"invaliduser\":\"u1\"}"));
            QyworkMessageClient client = buildClient(server);

            assertThrows(BusinessException.class, () -> client.sendMessage("token-1", request()));
        }
    }

    private QyworkMessageClient buildClient(MockWebServer server) {
        QyworkProperties properties = new QyworkProperties();
        properties.setBaseUrl(server.url("/").toString());
        return new QyworkMessageClient(new OkHttpClient(), new ObjectMapper(), properties);
    }

    private QyworkMessageSendRequest request() {
        return QyworkMessageSendRequest.builder()
                .toUser("u1")
                .msgType("markdown")
                .agentId(100001)
                .markdown(QyworkMessageSendRequest.Markdown.builder()
                        .content("# 标题")
                        .build())
                .build();
    }
}
