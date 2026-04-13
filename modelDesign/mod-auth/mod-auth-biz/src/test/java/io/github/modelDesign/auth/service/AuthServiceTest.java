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
import io.github.modelDesign.auth.request.RefreshTokenRequest;
import io.github.modelDesign.auth.request.RegisterRequest;
import io.github.modelDesign.auth.response.UserLoginVo;
import io.github.modelDesign.auth.session.AuthSession;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

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
        tokenService.accessTokenToReturn = "token-123";
        tokenService.accessExpireTimeToReturn = 180000L;
        tokenService.refreshTokenToReturn = "refresh-123";
        tokenService.refreshExpireTimeToReturn = 280000L;
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

        assertEquals("token-123", loginVo.getAccessToken());
        assertEquals(180000L, loginVo.getAccessExpireTime());
        assertEquals("refresh-123", loginVo.getRefreshToken());
        assertEquals(280000L, loginVo.getRefreshExpireTime());
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
     * 注册成功后应创建启用用户并直接返回登录态。
     */
    @Test
    void registerShouldCreateEnabledUserAndReturnLoginVo() {
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
                .browserVersion("136.0.0")
                .osName("macOS")
                .osVersion("15")
                .deviceType(LoginDeviceTypeEnum.DESKTOP)
                .build();
        tokenService.accessTokenToReturn = "register-token";
        tokenService.accessExpireTimeToReturn = 888L;
        tokenService.refreshTokenToReturn = "register-refresh-token";
        tokenService.refreshExpireTimeToReturn = 999L;
        tenantService.tenantById = buildEnabledTenant(3003L);
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("10.10.10.10");
        httpRequest.addHeader("User-Agent", "Mozilla/5.0");

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );

        UserLoginVo loginVo = authService.register(
                buildRegisterRequest("新人", "new-user", 3003L, "md5-password"),
                httpRequest
        );

        assertEquals("register-token", loginVo.getAccessToken());
        assertEquals(888L, loginVo.getAccessExpireTime());
        assertEquals("register-refresh-token", loginVo.getRefreshToken());
        assertEquals(999L, loginVo.getRefreshExpireTime());
        assertNotNull(userService.savedUser);
        assertEquals("新人", userService.savedUser.getNickname());
        assertEquals("new-user", userService.savedUser.getUsername());
        assertEquals(3003L, userService.savedUser.getTenantId());
        assertEquals(1, userService.savedUser.getStatus());
        assertNotNull(userService.savedUser.getPasswordHash());
        assertFalse(userService.savedUser.getPasswordHash().isBlank());
        assertNotNull(sessionRepository.savedAdmin);
        assertEquals("new-user", sessionRepository.savedAdmin.getUsername());
        assertEquals(3003L, sessionRepository.savedAdmin.getTenantId());
        assertNotNull(userLoginHistoryService.lastCommand);
        assertEquals(LoginAuditStatusEnum.SUCCESS,
                userLoginHistoryService.lastCommand.getLoginStatus());
    }

    /**
     * refresh token 匹配当前会话时，应返回新的双 token 并轮换 refresh token 标识。
     */
    @Test
    void refreshTokenShouldRotateSessionWhenSessionMatches() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        TokenService tokenService = new TokenService(new AuthProperties());
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );
        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(1001L)
                .tenantId(2002L)
                .username("alice")
                .nickname("Alice")
                .loginId("login-1")
                .loginIp("127.0.0.1")
                .tokenCreateTime(LocalDateTime.of(2026, 4, 12, 8, 0))
                .build();
        sessionRepository.save(currentAdmin, "refresh-id-1");
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(
                tokenService.createRefreshToken(currentAdmin, "refresh-id-1")
        );

        UserLoginVo loginVo = authService.refreshToken(request);

        assertNotNull(loginVo.getAccessToken());
        assertFalse(loginVo.getAccessToken().isBlank());
        assertNotNull(loginVo.getRefreshToken());
        assertFalse(loginVo.getRefreshToken().isBlank());
        assertFalse(
                Objects.equals("refresh-id-1", sessionRepository.savedRefreshTokenId)
        );
        assertEquals(
                sessionRepository.savedRefreshTokenId,
                tokenService.parseRefreshClaims(loginVo.getRefreshToken())
                        .get("refreshTokenId", String.class)
        );
    }

    /**
     * 注册时若用户名重复，应拒绝创建用户。
     */
    @Test
    void registerShouldRejectDuplicateUsername() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        tenantService.tenantById = buildEnabledTenant(3003L);
        userService.userByUsername = buildEnabledUser();

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.register(
                        buildRegisterRequest("新人", "alice", 3003L,
                                "md5-password"),
                        new MockHttpServletRequest()
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("用户名已存在", exception.getMessage());
    }

    /**
     * 注册时若租户被禁用，应直接拒绝。
     */
    @Test
    void registerShouldRejectDisabledTenant() {
        FakeUserService userService = new FakeUserService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        FakeTenantService tenantService = new FakeTenantService();
        FakeTokenService tokenService = new FakeTokenService();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakeLoginClientInfoResolver clientInfoResolver =
                new FakeLoginClientInfoResolver();
        tenantService.tenantById = buildDisabledTenant(3003L);

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                userLoginHistoryService,
                clientInfoResolver
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.register(
                        buildRegisterRequest("新人", "new-user", 3003L,
                                "md5-password"),
                        new MockHttpServletRequest()
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("租户已被禁用，不能继续分配", exception.getMessage());
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
        tokenService.accessTokenToReturn = "token-123";
        tokenService.accessExpireTimeToReturn = 180000L;
        tokenService.refreshTokenToReturn = "refresh-123";
        tokenService.refreshExpireTimeToReturn = 280000L;
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
        tokenService.accessTokenToReturn = "token-success";
        tokenService.accessExpireTimeToReturn = 999L;
        tokenService.refreshTokenToReturn = "refresh-success";
        tokenService.refreshExpireTimeToReturn = 1999L;
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

        assertEquals("token-success", loginVo.getAccessToken());
        assertEquals(999L, loginVo.getAccessExpireTime());
        assertEquals("refresh-success", loginVo.getRefreshToken());
        assertEquals(1999L, loginVo.getRefreshExpireTime());
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
     * 组装注册请求对象。
     *
     * @param nickname 用户昵称
     * @param username 用户名
     * @param tenantId 租户 ID
     * @param password 密码摘要
     * @return 注册请求
     */
    private RegisterRequest buildRegisterRequest(String nickname, String username,
                                                 Long tenantId,
                                                 String password) {
        RegisterRequest request = new RegisterRequest();
        request.setNickname(nickname);
        request.setUsername(username);
        request.setTenantId(tenantId);
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
     * 构造启用租户实体。
     *
     * @param tenantId 租户 ID
     * @return 租户实体
     */
    private Tenant buildEnabledTenant(Long tenantId) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus(1);
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

        /**
         * 最近一次保存的用户。
         */
        private User savedUser;

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

        @Override
        public User createUser(String nickname, String username, Long tenantId,
                               String password, Boolean isDisable) {
            if (userByUsername != null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(),
                        "用户名已存在");
            }
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            User user = new User();
            user.setId(9999L);
            user.setNickname(nickname);
            user.setUsername(username);
            user.setTenantId(tenantId);
            user.setStatus(1);
            user.setPasswordHash(encoder.encode(password));
            savedUser = user;
            userByUsername = user;
            return user;
        }

        @Override
        public boolean save(User entity) {
            savedUser = entity;
            if (entity.getId() == null) {
                entity.setId(9999L);
            }
            userByUsername = entity;
            return true;
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

        /**
         * 最近一次保存的 refresh token 标识。
         */
        private String savedRefreshTokenId;

        /**
         * 当前会话聚合。
         */
        private AuthSession authSession;

        FakeSessionRepository() {
            super(null, new AuthProperties());
        }

        @Override
        public void save(CurrentAdmin currentAdmin, String refreshTokenId) {
            savedAdmin = currentAdmin;
            savedRefreshTokenId = refreshTokenId;
            authSession = AuthSession.builder()
                    .currentAdmin(currentAdmin)
                    .refreshTokenId(refreshTokenId)
                    .build();
        }

        @Override
        public CurrentAdmin get(String loginId) {
            AuthSession currentSession = getSession(loginId);
            if (currentSession == null) {
                return null;
            }
            return currentSession.getCurrentAdmin();
        }

        @Override
        public AuthSession getSession(String loginId) {
            if (savedAdmin == null || authSession == null) {
                return null;
            }
            if (!Objects.equals(savedAdmin.getLoginId(), loginId)) {
                return null;
            }
            return authSession;
        }

        @Override
        public void remove(String loginId) {
            String currentLoginId = null;
            if (savedAdmin != null) {
                currentLoginId = savedAdmin.getLoginId();
            }
            if (!Objects.equals(currentLoginId, loginId)) {
                return;
            }
            savedAdmin = null;
            savedRefreshTokenId = null;
            authSession = null;
        }

        @Override
        public void updateCurrentAdmin(CurrentAdmin currentAdmin) {
            if (authSession == null) {
                return;
            }
            savedAdmin = currentAdmin;
            authSession.setCurrentAdmin(currentAdmin);
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

        @Override
        public Long requireAssignableTenantId(Long tenantId) {
            Tenant tenant = tenantById;
            if (tenant == null || tenant.getId() == null
                    || !tenant.getId().equals(tenantId)
                    || Integer.valueOf(1).equals(tenant.getDeleted())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(),
                        "租户不存在");
            }
            if (!Integer.valueOf(1).equals(tenant.getStatus())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(),
                        "租户已被禁用，不能继续分配");
            }
            return tenantId;
        }
    }

    /**
     * 令牌服务测试替身。
     */
    private static final class FakeTokenService extends TokenService {
        /**
         * 固定返回的 access token。
         */
        private String accessTokenToReturn = "token";

        /**
         * 固定返回的 refresh token。
         */
        private String refreshTokenToReturn = "refresh-token";

        /**
         * 固定返回的 access token 过期时间。
         */
        private long accessExpireTimeToReturn = 1L;

        /**
         * 固定返回的 refresh token 过期时间。
         */
        private long refreshExpireTimeToReturn = 2L;

        FakeTokenService() {
            super(new AuthProperties());
        }

        @Override
        public String createAccessToken(CurrentAdmin currentAdmin) {
            return accessTokenToReturn;
        }

        @Override
        public String createRefreshToken(CurrentAdmin currentAdmin,
                                         String refreshTokenId) {
            return refreshTokenToReturn;
        }

        @Override
        public long getAccessExpireTime() {
            return accessExpireTimeToReturn;
        }

        @Override
        public long getRefreshExpireTime() {
            return refreshExpireTimeToReturn;
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
