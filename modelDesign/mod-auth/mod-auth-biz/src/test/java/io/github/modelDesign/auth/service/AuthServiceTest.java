package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.core.toolkit.support.SFunction;
import com.baomidou.mybatisplus.extension.conditions.update.LambdaUpdateChainWrapper;
import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.domain.Tenant;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.auth.request.PasswordLoginRequest;
import io.github.modelDesign.auth.response.UserLoginVo;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.io.Serializable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 认证服务测试。
 */
class AuthServiceTest {
    /**
     * 用户不存在时应抛出原有错误文案，并写入失败审计。
     */
    @Test
    void passwordLoginShouldRecordFailureAuditWhenUserNotFound() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder()
                .browserName("UNKNOWN")
                .browserVersion("UNKNOWN")
                .osName("UNKNOWN")
                .osVersion("UNKNOWN")
                .deviceType(LoginDeviceTypeEnum.UNKNOWN)
                .build();

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("ghost", "pwd");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("10.0.0.8");

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.passwordLogin(request, httpRequest)
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("账号或密码错误", exception.getMessage());
        LoginAuditWriteCommand command = userLoginHistoryService.lastCommand;
        assertNotNull(command);
        assertEquals(LoginAuditStatusEnum.FAILURE, command.getLoginStatus());
        assertEquals(LoginFailureReasonEnum.USER_NOT_FOUND,
                command.getFailureReasonCode());
        assertEquals("ghost", command.getUsername());
        assertEquals("10.0.0.8", command.getLoginIp());
        assertEquals("", command.getUserAgent());
        assertEquals(UserLoginHistoryService.PASSWORD_LOGIN_TYPE,
                command.getLoginType());
    }

    /**
     * 成功登录后应写入成功审计。
     */
    @Test
    void passwordLoginShouldRecordSuccessAuditWhenLoginSucceed() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder()
                .browserName("Chrome")
                .browserVersion("124.0.0.0")
                .osName("Windows")
                .osVersion("11")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .build();
        tokenService.tokenToReturn = "token-123";
        tokenService.expireTimeToReturn = 180000L;
        userService.userByUsername = buildEnabledUser();

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("alice", "test-password");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("192.168.1.22");
        httpRequest.addHeader("User-Agent", "Mozilla/5.0");

        UserLoginVo loginVo = authService.passwordLogin(request, httpRequest);

        assertEquals("token-123", loginVo.getToken());
        assertEquals(180000L, loginVo.getExpireTime());
        assertNotNull(sessionRepository.savedAdmin);
        assertNotNull(sessionRepository.savedAdmin.getLoginId());
        assertFalse(sessionRepository.savedAdmin.getLoginId().isBlank());
        assertNotNull(userService.lastUpdateChain);
        assertEquals(1001L, userService.lastUpdateChain.eqValue);
        assertEquals("192.168.1.22", userService.lastUpdateChain.ipValue);
        assertNotNull(userService.lastUpdateChain.loginTimeValue);

        LoginAuditWriteCommand command = userLoginHistoryService.lastCommand;
        assertNotNull(command);
        assertEquals(LoginAuditStatusEnum.SUCCESS, command.getLoginStatus());
        assertEquals(1001L, command.getUserId());
        assertEquals(2002L, command.getTenantId());
        assertEquals("alice", command.getUsername());
        assertNotNull(command.getLoginId());
        assertFalse(command.getLoginId().isBlank());
        assertEquals("192.168.1.22", command.getLoginIp());
        assertEquals(UserLoginHistoryService.PASSWORD_LOGIN_TYPE,
                command.getLoginType());
        assertEquals("Mozilla/5.0", command.getUserAgent());
        assertEquals("Chrome", command.getBrowserName());
        assertEquals("124.0.0.0", command.getBrowserVersion());
        assertEquals("Windows", command.getOsName());
        assertEquals("11", command.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.DESKTOP, command.getDeviceType());
    }

    /**
     * 审计命令中的客户端字符串字段应统一为非空稳定值。
     */
    @Test
    void passwordLoginShouldNormalizeAuditClientFieldsToNonNull() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder().build();
        tokenService.tokenToReturn = "token-123";
        tokenService.expireTimeToReturn = 180000L;
        userService.userByUsername = buildEnabledUser();

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("alice", "test-password");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("192.168.1.22");

        authService.passwordLogin(request, httpRequest);

        LoginAuditWriteCommand command = userLoginHistoryService.lastCommand;
        assertNotNull(command);
        assertNotNull(command.getBrowserName());
        assertNotNull(command.getBrowserVersion());
        assertNotNull(command.getOsName());
        assertNotNull(command.getOsVersion());
        assertNotNull(command.getUserAgent());
    }

    /**
     * 登录历史查询在租户为空时应直接拒绝，避免放弃租户隔离。
     */
    @Test
    void getRecentLoginHistoryShouldRejectNullTenantId() {
        UserLoginHistoryService userLoginHistoryService = new UserLoginHistoryService(
                new LoginAuditRecordFactory()
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> userLoginHistoryService.getRecentLoginHistory(1001L, null)
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
    }

    /**
     * 成功登录时即使审计写入失败，也不能影响主流程返回。
     */
    @Test
    void passwordLoginShouldNotFailWhenSuccessAuditWriteThrows() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder()
                .browserName("Chrome")
                .browserVersion("124.0.0.0")
                .osName("Windows")
                .osVersion("11")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .build();
        tokenService.tokenToReturn = "token-success";
        tokenService.expireTimeToReturn = 999L;
        userService.userByUsername = buildEnabledUser();
        userLoginHistoryService.throwOnRecord = true;

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("alice", "test-password");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("127.0.0.9");
        httpRequest.addHeader("User-Agent", "Mozilla/5.0");

        UserLoginVo loginVo = authService.passwordLogin(request, httpRequest);

        assertEquals("token-success", loginVo.getToken());
        assertEquals(999L, loginVo.getExpireTime());
    }

    /**
     * 失败登录时即使审计写入失败，也必须保持原有错误文案不变。
     */
    @Test
    void passwordLoginShouldKeepOriginalErrorWhenFailureAuditWriteThrows() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder()
                .browserName("UNKNOWN")
                .browserVersion("UNKNOWN")
                .osName("UNKNOWN")
                .osVersion("UNKNOWN")
                .deviceType(LoginDeviceTypeEnum.UNKNOWN)
                .build();
        userLoginHistoryService.throwOnRecord = true;

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("ghost", "pwd");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("10.0.0.8");

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.passwordLogin(request, httpRequest)
        );

        assertEquals("账号或密码错误", exception.getMessage());
    }

    /**
     * 租户禁用审计应基于租户状态判定，而不是依赖异常文案等值。
     */
    @Test
    void passwordLoginShouldRecordTenantDisabledAuditWithoutMessageMatching() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        clientInfoResolver.nextClientInfo = LoginClientInfo.builder()
                .browserName("Chrome")
                .browserVersion("124.0.0.0")
                .osName("Windows")
                .osVersion("11")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .build();
        userService.userByUsername = buildEnabledUser();
        tenantService.tenantById = buildDisabledTenant(2002L);
        tenantService.validateException = new BusinessException(
                HttpStatus.BAD_REQUEST.value(),
                "自定义禁用文案"
        );

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        PasswordLoginRequest request = buildRequest("alice", "test-password");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("127.0.0.1");
        httpRequest.addHeader("User-Agent", "Mozilla/5.0");

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.passwordLogin(request, httpRequest)
        );

        assertEquals("自定义禁用文案", exception.getMessage());
        LoginAuditWriteCommand command = userLoginHistoryService.lastCommand;
        assertNotNull(command);
        assertEquals(LoginAuditStatusEnum.FAILURE, command.getLoginStatus());
        assertEquals(LoginFailureReasonEnum.TENANT_DISABLED,
                command.getFailureReasonCode());
    }

    /**
     * 组装登录请求对象。
     *
     * @param username 登录用户名
     * @param password 登录密码
     * @return 登录请求
     */
    private PasswordLoginRequest buildRequest(String username, String password) {
        PasswordLoginRequest request = new PasswordLoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    /**
     * 组装启用中的用户实体。
     *
     * @return 用户实体
     */
    private User buildEnabledUser() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setId(1001L);
        user.setTenantId(2002L);
        user.setUsername("alice");
        user.setNickname("Alice");
        user.setStatus(1);
        user.setPasswordHash(encoder.encode("test-password"));
        return user;
    }

    /**
     * 构造禁用租户实体。
     *
     * @param tenantId 租户 ID
     * @return 租户实体
     */
    private Tenant buildDisabledTenant(Long tenantId) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus(0);
        tenant.setDeleted(0);
        return tenant;
    }

    /**
     * 用户服务测试替身。
     */
    private static final class FakeUserService extends UserService {
        /**
         * 按用户名返回的用户。
         */
        private User userByUsername;

        /**
         * 最近一次创建的更新链。
         */
        private FakeLambdaUpdateChainWrapper lastUpdateChain;

        FakeUserService() {
            super(
                    new TenantService(),
                    new UserListQueryContextFactory(),
                    null
            );
        }

        @Override
        public User getByUsername(String username) {
            return userByUsername;
        }

        @Override
        public LambdaUpdateChainWrapper<User> lambdaUpdate() {
            lastUpdateChain = new FakeLambdaUpdateChainWrapper();
            return lastUpdateChain;
        }
    }

    /**
     * 链式更新器测试替身。
     */
    private static final class FakeLambdaUpdateChainWrapper
            extends LambdaUpdateChainWrapper<User> {
        /**
         * eq 传入的用户 ID。
         */
        private Long eqValue;

        /**
         * set 传入的登录 IP。
         */
        private String ipValue;

        /**
         * set 传入的登录时间。
         */
        private LocalDateTime loginTimeValue;

        FakeLambdaUpdateChainWrapper() {
            super(User.class);
        }

        @Override
        public LambdaUpdateChainWrapper<User> eq(boolean condition,
                                                 SFunction<User, ?> column,
                                                 Object val) {
            if (condition && val instanceof Long userId) {
                eqValue = userId;
            }
            return this;
        }

        @Override
        public LambdaUpdateChainWrapper<User> set(boolean condition,
                                                  SFunction<User, ?> column,
                                                  Object val) {
            captureSetValue(condition, val);
            return this;
        }

        @Override
        public LambdaUpdateChainWrapper<User> set(boolean condition,
                                                  SFunction<User, ?> column,
                                                  Object val,
                                                  String mapping) {
            captureSetValue(condition, val);
            return this;
        }

        /**
         * 捕获更新链 set 的值，避免依赖 MyBatis-Plus 内部转发路径。
         *
         * @param condition 条件
         * @param val       设置值
         */
        private void captureSetValue(boolean condition, Object val) {
            if (condition && val instanceof String loginIp) {
                ipValue = loginIp;
            }
            if (condition && val instanceof LocalDateTime loginTime) {
                loginTimeValue = loginTime;
            }
        }

        @Override
        public boolean update() {
            return true;
        }
    }

    /**
     * 会话仓储测试替身。
     */
    private static final class FakeSessionRepository extends SessionRepository {
        /**
         * 最近一次保存的会话。
         */
        private CurrentAdmin savedAdmin;

        FakeSessionRepository() {
            super(null, new AuthProperties());
        }

        @Override
        public void save(CurrentAdmin currentAdmin) {
            savedAdmin = currentAdmin;
        }
    }

    /**
     * 租户服务测试替身。
     */
    private static final class FakeTenantService extends TenantService {
        /**
         * 校验异常。
         */
        private BusinessException validateException;

        /**
         * 按 ID 查询返回的租户。
         */
        private Tenant tenantById;

        @Override
        public void validateLoginTenant(Long tenantId) {
            if (validateException != null) {
                throw validateException;
            }
        }

        @Override
        public Tenant getById(Serializable id) {
            return tenantById;
        }
    }

    /**
     * 令牌服务测试替身。
     */
    private static final class FakeTokenService extends TokenService {
        /**
         * 固定返回的 token。
         */
        private String tokenToReturn = "token";

        /**
         * 固定返回的过期时间。
         */
        private long expireTimeToReturn = 1L;

        FakeTokenService() {
            super(new AuthProperties());
        }

        @Override
        public String createToken(CurrentAdmin currentAdmin) {
            return tokenToReturn;
        }

        @Override
        public long getExpireTime() {
            return expireTimeToReturn;
        }
    }

    /**
     * 登录历史服务测试替身。
     */
    private static final class FakeUserLoginHistoryService
            extends UserLoginHistoryService {
        /**
         * 最近一次写入命令。
         */
        private LoginAuditWriteCommand lastCommand;

        /**
         * 是否在写审计时抛出异常。
         */
        private boolean throwOnRecord;

        FakeUserLoginHistoryService() {
            super(new LoginAuditRecordFactory());
        }

        @Override
        public void record(LoginAuditWriteCommand command) {
            if (throwOnRecord) {
                throw new RuntimeException("模拟审计写入失败");
            }
            lastCommand = command;
        }
    }

    /**
     * 客户端信息解析器测试替身。
     */
    private static final class FakeLoginClientInfoResolver
            extends LoginClientInfoResolver {
        /**
         * 下次返回的客户端信息。
         */
        private LoginClientInfo nextClientInfo;

        @Override
        public LoginClientInfo resolve(String userAgent) {
            return nextClientInfo;
        }
    }
}
