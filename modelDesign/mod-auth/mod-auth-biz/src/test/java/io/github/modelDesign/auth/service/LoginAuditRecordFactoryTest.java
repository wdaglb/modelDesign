package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * 登录审计记录工厂测试。
 */
class LoginAuditRecordFactoryTest {
    /**
     * 非空字段在命令缺失时应回退到稳定默认值，避免写库触发约束异常。
     */
    @Test
    void createShouldApplyStableDefaultsForNotNullFields() {
        LoginAuditRecordFactory factory = new LoginAuditRecordFactory();
        LoginAuditWriteCommand command = LoginAuditWriteCommand.builder()
                .loginStatus(LoginAuditStatusEnum.FAILURE)
                .username("carol")
                .failureReasonCode(LoginFailureReasonEnum.SYSTEM_ERROR)
                .failureReasonText("系统异常")
                .build();

        UserLoginHistory record = factory.create(command);

        assertEquals("", record.getLoginIp());
        assertEquals("", record.getLoginType());
        assertEquals(LoginDeviceTypeEnum.UNKNOWN, record.getDeviceType());
    }

    /**
     * 成功登录应组装完整客户端信息，且失败原因字段为空。
     */
    @Test
    void createShouldAssembleSuccessRecord() {
        LoginAuditRecordFactory factory = new LoginAuditRecordFactory();
        LoginAuditWriteCommand command = LoginAuditWriteCommand.builder()
                .userId(1001L)
                .tenantId(2001L)
                .loginId("LOGIN-OK-001")
                .loginIp("127.0.0.1")
                .loginType("PASSWORD")
                .loginStatus(LoginAuditStatusEnum.SUCCESS)
                .username("alice")
                .userAgent("Mozilla/5.0")
                .browserName("Chrome")
                .browserVersion("124.0.0.0")
                .osName("Windows")
                .osVersion("11")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .build();

        UserLoginHistory record = factory.create(command);

        assertEquals(LoginAuditStatusEnum.SUCCESS, record.getLoginStatus());
        assertEquals("alice", record.getUsername());
        assertEquals("LOGIN-OK-001", record.getLoginId());
        assertEquals("Chrome", record.getBrowserName());
        assertEquals("124.0.0.0", record.getBrowserVersion());
        assertEquals("Windows", record.getOsName());
        assertEquals("11", record.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.DESKTOP, record.getDeviceType());
        assertNull(record.getFailureReasonCode());
        assertNull(record.getFailureReasonText());
    }

    /**
     * 失败登录应允许缺失登录流水号，并保留失败原因信息。
     */
    @Test
    void createShouldAssembleFailureRecord() {
        LoginAuditRecordFactory factory = new LoginAuditRecordFactory();
        LoginAuditWriteCommand command = LoginAuditWriteCommand.builder()
                .loginIp("192.168.1.20")
                .loginType("PASSWORD")
                .loginStatus(LoginAuditStatusEnum.FAILURE)
                .username("bob")
                .userAgent("Mozilla/5.0")
                .browserName("Safari")
                .browserVersion("17.4")
                .osName("macOS")
                .osVersion("14.4")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .failureReasonCode(LoginFailureReasonEnum.PASSWORD_MISMATCH)
                .failureReasonText("密码错误")
                .build();

        UserLoginHistory record = factory.create(command);

        assertEquals(LoginAuditStatusEnum.FAILURE, record.getLoginStatus());
        assertEquals("bob", record.getUsername());
        assertNull(record.getLoginId());
        assertEquals(LoginFailureReasonEnum.PASSWORD_MISMATCH,
                record.getFailureReasonCode());
        assertEquals("密码错误", record.getFailureReasonText());
    }
}
