package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 登录客户端信息解析器测试。
 */
class LoginClientInfoResolverTest {
    /**
     * 桌面端 Chrome UA 应识别为桌面设备，并解析浏览器与系统信息。
     */
    @Test
    void resolveShouldParseDesktopChrome() {
        LoginClientInfoResolver resolver = new LoginClientInfoResolver();
        String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                + "AppleWebKit/537.36 (KHTML, like Gecko) "
                + "Chrome/123.0.0.0 Safari/537.36";

        LoginClientInfo info = resolver.resolve(userAgent);

        assertEquals("Chrome", info.getBrowserName());
        assertTrue(info.getBrowserVersion().startsWith("123."));
        assertEquals("Windows", info.getOsName());
        assertEquals("10.0", info.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.DESKTOP, info.getDeviceType());
    }

    /**
     * 企业微信 UA 命中移动端时应识别为 MOBILE。
     */
    @Test
    void resolveShouldDetectQywxAsMobile() {
        LoginClientInfoResolver resolver = new LoginClientInfoResolver();
        String userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
                + "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 "
                + "wxwork/4.1.20 MicroMessenger/8.0.47";

        LoginClientInfo info = resolver.resolve(userAgent);

        assertEquals("wxwork", info.getBrowserName());
        assertTrue(info.getBrowserVersion().startsWith("4."));
        assertEquals("iOS", info.getOsName());
        assertEquals("16.6", info.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.MOBILE, info.getDeviceType());
    }

    /**
     * 微信 UA 不能被误判为 Safari，应识别为 MicroMessenger。
     */
    @Test
    void resolveShouldDetectWechatBeforeSafari() {
        LoginClientInfoResolver resolver = new LoginClientInfoResolver();
        String userAgent = "Mozilla/5.0 (Linux; Android 13; Pixel 7) "
                + "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 "
                + "Chrome/112.0.0.0 Mobile Safari/537.36 "
                + "MicroMessenger/8.0.49";

        LoginClientInfo info = resolver.resolve(userAgent);

        assertEquals("MicroMessenger", info.getBrowserName());
        assertTrue(info.getBrowserVersion().startsWith("8."));
        assertEquals("Android", info.getOsName());
        assertEquals("13", info.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.MOBILE, info.getDeviceType());
    }

    /**
     * 空 UA 需要回退到 UNKNOWN。
     */
    @Test
    void resolveShouldFallbackToUnknownWhenUserAgentIsEmpty() {
        LoginClientInfoResolver resolver = new LoginClientInfoResolver();

        LoginClientInfo info = resolver.resolve("   ");

        assertEquals("UNKNOWN", info.getBrowserName());
        assertEquals("UNKNOWN", info.getBrowserVersion());
        assertEquals("UNKNOWN", info.getOsName());
        assertEquals("UNKNOWN", info.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.UNKNOWN, info.getDeviceType());
    }
}
