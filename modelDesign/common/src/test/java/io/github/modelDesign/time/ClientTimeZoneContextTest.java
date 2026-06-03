package io.github.modelDesign.time;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 客户端时区上下文测试。
 */
class ClientTimeZoneContextTest {
    @AfterEach
    void clearContext() {
        ClientTimeZoneContext.clear();
    }

    /**
     * 合法 IANA 时区应写入当前请求上下文。
     */
    @Test
    void setShouldUseValidClientZoneId() {
        ClientTimeZoneContext.set("Asia/Shanghai");

        assertEquals(ZoneId.of("Asia/Shanghai"), ClientTimeZoneContext.getZoneId());
    }

    /**
     * 非法时区不能污染上下文，应回退系统默认时区。
     */
    @Test
    void setShouldFallbackWhenClientZoneIdInvalid() {
        ClientTimeZoneContext.set("invalid-zone");

        assertEquals(ZoneId.systemDefault(), ClientTimeZoneContext.getZoneId());
    }
}
