package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.request.LoginAuditPageRequest;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 登录历史视图映射测试。
 */
class LoginHistoryViewMappingTest {
    /**
     * 当前用户登录历史映射应覆盖扩展后的客户端信息字段。
     */
    @Test
    void toLoginHistoryVoShouldMapExpandedClientFields() {
        LocalDateTime loginTime = LocalDateTime.of(2026, 4, 1, 9, 30, 0);
        UserLoginHistory history = new UserLoginHistory();
        history.setLoginId("LOGIN-20260401-0001");
        history.setLoginIp("10.10.10.10");
        history.setLoginType("PASSWORD");
        history.setCreateTime(loginTime);
        history.setBrowserName("Chrome");
        history.setBrowserVersion("124.0.0.0");
        history.setOsName("Windows");
        history.setOsVersion("11");
        history.setDeviceType(LoginDeviceTypeEnum.DESKTOP);

        LoginHistoryVo vo = UserLoginHistoryService.toLoginHistoryVo(history);

        assertEquals("LOGIN-20260401-0001", vo.getLoginId());
        assertEquals("10.10.10.10", vo.getLoginIp());
        assertEquals("PASSWORD", vo.getLoginType());
        assertEquals(loginTime, vo.getLoginTime());
        assertEquals("Chrome", vo.getBrowserName());
        assertEquals("124.0.0.0", vo.getBrowserVersion());
        assertEquals("Windows", vo.getOsName());
        assertEquals("11", vo.getOsVersion());
        assertEquals("DESKTOP", vo.getDeviceType());
    }

    /**
     * 管理员登录审计分页在租户为空时应直接拒绝，避免跨租户全量查询。
     */
    @Test
    void getLoginAuditPageShouldRejectWhenTenantIdIsNull() {
        UserLoginHistoryService service = new UserLoginHistoryService(
                new LoginAuditRecordFactory()
        );
        LoginAuditPageRequest request = new LoginAuditPageRequest();
        request.setTenantId(null);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getLoginAuditPage(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("租户不能为空", exception.getMessage());
    }

    /**
     * 管理员登录审计分页在页码为空时应直接拒绝，避免自动拆箱触发空指针。
     */
    @Test
    void getLoginAuditPageShouldRejectWhenCurrentIsNull() {
        UserLoginHistoryService service = new UserLoginHistoryService(
                new LoginAuditRecordFactory()
        );
        LoginAuditPageRequest request = new LoginAuditPageRequest();
        request.setTenantId(2001L);
        request.setCurrent(null);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getLoginAuditPage(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("页码不能为空", exception.getMessage());
    }

    /**
     * 管理员登录审计分页在每页条数为空时应直接拒绝，避免自动拆箱触发空指针。
     */
    @Test
    void getLoginAuditPageShouldRejectWhenPageSizeIsNull() {
        UserLoginHistoryService service = new UserLoginHistoryService(
                new LoginAuditRecordFactory()
        );
        LoginAuditPageRequest request = new LoginAuditPageRequest();
        request.setTenantId(2001L);
        request.setPageSize(null);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getLoginAuditPage(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("每页条数不能为空", exception.getMessage());
    }
}
