package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.Tenant;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.auth.request.ChangePasswordRequest;
import io.github.modelDesign.auth.request.PasswordLoginRequest;
import io.github.modelDesign.auth.request.RegisterRequest;
import io.github.modelDesign.auth.request.UpdateCurrentProfileRequest;
import io.github.modelDesign.auth.response.CurrentInfoVo;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import io.github.modelDesign.auth.response.UserLoginVo;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 认证服务。
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    /**
     * 认证服务日志。
     */
    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());

    /**
     * 审计客户端信息未知占位值。
     */
    private static final String AUDIT_UNKNOWN_TEXT = "UNKNOWN";

    /**
     * 管理员服务。
     */
    private final UserService userService;

    /**
     * 会话仓储。
     */
    private final SessionRepository sessionRepository;

    /**
     * 租户服务。
     */
    private final TenantService tenantService;

    /**
     * JWT 服务。
     */
    private final TokenService tokenService;

    /**
     * 登录历史服务。
     */
    private final UserLoginHistoryService userLoginHistoryService;

    /**
     * 登录客户端信息解析器。
     */
    private final LoginClientInfoResolver loginClientInfoResolver;

    /**
     * 密码编码器。
     */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 用户名密码登录。
     *
     * @param request     登录请求
     * @param httpRequest HTTP 请求
     * @return 登录响应
     */
    public UserLoginVo passwordLogin(PasswordLoginRequest request, HttpServletRequest httpRequest) {
        String loginIp = resolveIp(httpRequest);
        String userAgent = resolveUserAgent(httpRequest);
        LoginClientInfo clientInfo = loginClientInfoResolver.resolve(userAgent);
        User user = userService.getByUsername(request.getUsername());
        if (user == null) {
            recordFailureAudit(
                    request.getUsername(),
                    null,
                    null,
                    loginIp,
                    userAgent,
                    clientInfo,
                    LoginFailureReasonEnum.USER_NOT_FOUND
            );
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            recordFailureAudit(
                    request.getUsername(),
                    user.getId(),
                    user.getTenantId(),
                    loginIp,
                    userAgent,
                    clientInfo,
                    LoginFailureReasonEnum.USER_DISABLED
            );
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号已被禁用");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            recordFailureAudit(
                    request.getUsername(),
                    user.getId(),
                    user.getTenantId(),
                    loginIp,
                    userAgent,
                    clientInfo,
                    LoginFailureReasonEnum.PASSWORD_MISMATCH
            );
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }
        if (user.getTenantId() == null) {
            recordFailureAudit(
                    request.getUsername(),
                    user.getId(),
                    null,
                    loginIp,
                    userAgent,
                    clientInfo,
                    LoginFailureReasonEnum.USER_TENANT_MISSING
            );
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户未绑定租户");
        }
        if (isTenantDisabledForAudit(user.getTenantId())) {
            recordFailureAudit(
                    request.getUsername(),
                    user.getId(),
                    user.getTenantId(),
                    loginIp,
                    userAgent,
                    clientInfo,
                    LoginFailureReasonEnum.TENANT_DISABLED
            );
        }
        tenantService.validateLoginTenant(user.getTenantId());
        return createLoginResponse(user, loginIp, userAgent, clientInfo);
    }

    /**
     * 匿名注册并自动登录。
     *
     * @param request     注册请求
     * @param httpRequest HTTP 请求
     * @return 登录响应
     */
    public UserLoginVo register(RegisterRequest request, HttpServletRequest httpRequest) {
        Long tenantId = tenantService.requireAssignableTenantId(request.getTenantId());
        User user = userService.createUser(
                request.getNickname(),
                request.getUsername(),
                tenantId,
                request.getPassword(),
                false
        );
        String loginIp = resolveIp(httpRequest);
        String userAgent = resolveUserAgent(httpRequest);
        LoginClientInfo clientInfo = loginClientInfoResolver.resolve(userAgent);
        return createLoginResponse(user, loginIp, userAgent, clientInfo);
    }

    /**
     * 获取当前登录用户信息。
     *
     * @return 当前登录用户信息
     */
    public CurrentInfoVo getCurrentInfo() {
        CurrentAdmin currentAdmin = AuthContext.get();
        return toCurrentInfoVo(currentAdmin);
    }

    /**
     * 更新当前登录用户基础资料。
     *
     * @param request 更新请求
     * @return 更新后的当前登录用户信息
     */
    public CurrentInfoVo updateCurrentProfile(UpdateCurrentProfileRequest request) {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        User user = userService.requireUser(currentAdmin.getUserId());
        String nickname = normalizeNickname(request.getNickname());
        String avatarId = normalizeAvatarId(request.getAvatarId());

        user.setNickname(nickname);
        user.setAvatarId(avatarId);
        userService.updateById(user);

        currentAdmin.setNickname(nickname);
        currentAdmin.setAvatarId(avatarId);
        sessionRepository.save(currentAdmin);

        return toCurrentInfoVo(currentAdmin);
    }

    /**
     * 修改当前登录用户密码。
     *
     * @param request 修改密码请求
     */
    public void changePassword(ChangePasswordRequest request) {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        User user = userService.getById(currentAdmin.getUserId());
        if (user == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户不存在");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前密码错误");
        }
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "新密码不能与当前密码相同");
        }
        userService.lambdaUpdate()
                .eq(User::getId, currentAdmin.getUserId())
                .set(User::getPasswordHash, passwordEncoder.encode(request.getNewPassword()))
                .update();
        sessionRepository.remove(currentAdmin.getLoginId());
    }

    /**
     * 获取当前登录用户最近登录历史。
     *
     * @return 最近登录历史
     */
    public List<LoginHistoryVo> getLoginHistory() {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        return userLoginHistoryService.getRecentLoginHistory(
                currentAdmin.getUserId(),
                currentAdmin.getTenantId()
        );
    }

    /**
     * 注销当前登录会话。
     */
    public void logout() {
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        sessionRepository.remove(currentAdmin.getLoginId());
    }

    private CurrentAdmin requireCurrentAdmin() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录");
        }
        return currentAdmin;
    }

    private String resolveIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return normalizeAuditValue(request.getRemoteAddr(), "");
    }

    /**
     * 解析登录请求头中的 User-Agent，统一空值回退。
     *
     * @param request HTTP 请求
     * @return User-Agent
     */
    private String resolveUserAgent(HttpServletRequest request) {
        return normalizeAuditValue(request.getHeader("User-Agent"), "");
    }

    /**
     * 创建登录会话并返回令牌响应。
     *
     * 这里被密码登录和注册成功共用，确保登录成功后的会话保存、
     * 用户最近登录信息更新以及审计写入行为保持一致。
     *
     * @param user       用户实体
     * @param loginIp    登录 IP
     * @param userAgent  用户代理
     * @param clientInfo 客户端解析信息
     * @return 登录响应
     */
    private UserLoginVo createLoginResponse(User user, String loginIp,
                                            String userAgent,
                                            LoginClientInfo clientInfo) {
        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarId(user.getAvatarId())
                .loginId(UUID.randomUUID().toString().replace("-", ""))
                .loginIp(loginIp)
                .tokenCreateTime(LocalDateTime.now())
                .build();
        sessionRepository.save(currentAdmin);

        userService.lambdaUpdate()
                .eq(User::getId, user.getId())
                .set(User::getLastLoginIp, currentAdmin.getLoginIp())
                .set(User::getLastLoginTime, currentAdmin.getTokenCreateTime())
                .update();
        recordSuccessAudit(currentAdmin, userAgent, clientInfo);

        return UserLoginVo.builder()
                .token(tokenService.createToken(currentAdmin))
                .expireTime(tokenService.getExpireTime())
                .build();
    }

    /**
     * 记录成功登录审计。
     *
     * @param currentAdmin 当前登录会话
     * @param userAgent    登录请求 User-Agent
     * @param clientInfo   登录客户端信息
     */
    private void recordSuccessAudit(CurrentAdmin currentAdmin, String userAgent,
                                    LoginClientInfo clientInfo) {
        LoginAuditWriteCommand command = LoginAuditWriteCommand.builder()
                .userId(currentAdmin.getUserId())
                .tenantId(currentAdmin.getTenantId())
                .loginId(currentAdmin.getLoginId())
                .loginIp(currentAdmin.getLoginIp())
                .loginType(UserLoginHistoryService.PASSWORD_LOGIN_TYPE)
                .loginStatus(LoginAuditStatusEnum.SUCCESS)
                .username(resolveUsername(currentAdmin.getUsername()))
                .userAgent(userAgent)
                .browserName(resolveBrowserName(clientInfo))
                .browserVersion(resolveBrowserVersion(clientInfo))
                .osName(resolveOsName(clientInfo))
                .osVersion(resolveOsVersion(clientInfo))
                .deviceType(resolveDeviceType(clientInfo))
                .build();
        safeRecordAudit(command);
    }

    /**
     * 记录失败登录审计。
     *
     * @param username          登录用户名
     * @param userId            用户 ID
     * @param tenantId          租户 ID
     * @param loginIp           登录 IP
     * @param userAgent         登录请求 User-Agent
     * @param clientInfo        登录客户端信息
     * @param failureReasonCode 失败原因
     */
    private void recordFailureAudit(String username, Long userId, Long tenantId,
                                    String loginIp, String userAgent,
                                    LoginClientInfo clientInfo,
                                    LoginFailureReasonEnum failureReasonCode) {
        LoginAuditWriteCommand command = LoginAuditWriteCommand.builder()
                .userId(userId)
                .tenantId(tenantId)
                .loginIp(loginIp)
                .loginType(UserLoginHistoryService.PASSWORD_LOGIN_TYPE)
                .loginStatus(LoginAuditStatusEnum.FAILURE)
                .username(resolveUsername(username))
                .userAgent(userAgent)
                .browserName(resolveBrowserName(clientInfo))
                .browserVersion(resolveBrowserVersion(clientInfo))
                .osName(resolveOsName(clientInfo))
                .osVersion(resolveOsVersion(clientInfo))
                .deviceType(resolveDeviceType(clientInfo))
                .failureReasonCode(failureReasonCode)
                .failureReasonText(failureReasonCode.getLabel())
                .build();
        safeRecordAudit(command);
    }

    /**
     * 安全写入登录审计，避免影响主登录流程。
     *
     * @param command 登录审计写入命令
     */
    private void safeRecordAudit(LoginAuditWriteCommand command) {
        try {
            userLoginHistoryService.record(command);
        } catch (Exception exception) {
            LOGGER.log(Level.WARNING, "登录审计写入失败，已忽略异常以保障主流程", exception);
        }
    }

    /**
     * 基于租户状态判断是否属于“租户禁用”场景。
     *
     * @param tenantId 租户 ID
     * @return 是否禁用
     */
    private boolean isTenantDisabledForAudit(Long tenantId) {
        if (tenantId == null) {
            return false;
        }
        Tenant tenant = tenantService.getById(tenantId);
        if (tenant == null) {
            return false;
        }
        if (Objects.equals(tenant.getDeleted(), 1)) {
            return false;
        }
        return !Objects.equals(tenant.getStatus(), 1);
    }

    /**
     * 解析浏览器名称。
     *
     * @param clientInfo 登录客户端信息
     * @return 浏览器名称
     */
    private String resolveBrowserName(LoginClientInfo clientInfo) {
        if (clientInfo == null) {
            return AUDIT_UNKNOWN_TEXT;
        }
        return normalizeAuditValue(clientInfo.getBrowserName(), AUDIT_UNKNOWN_TEXT);
    }

    /**
     * 解析浏览器版本。
     *
     * @param clientInfo 登录客户端信息
     * @return 浏览器版本
     */
    private String resolveBrowserVersion(LoginClientInfo clientInfo) {
        if (clientInfo == null) {
            return AUDIT_UNKNOWN_TEXT;
        }
        return normalizeAuditValue(clientInfo.getBrowserVersion(), AUDIT_UNKNOWN_TEXT);
    }

    /**
     * 解析操作系统名称。
     *
     * @param clientInfo 登录客户端信息
     * @return 操作系统名称
     */
    private String resolveOsName(LoginClientInfo clientInfo) {
        if (clientInfo == null) {
            return AUDIT_UNKNOWN_TEXT;
        }
        return normalizeAuditValue(clientInfo.getOsName(), AUDIT_UNKNOWN_TEXT);
    }

    /**
     * 解析操作系统版本。
     *
     * @param clientInfo 登录客户端信息
     * @return 操作系统版本
     */
    private String resolveOsVersion(LoginClientInfo clientInfo) {
        if (clientInfo == null) {
            return AUDIT_UNKNOWN_TEXT;
        }
        return normalizeAuditValue(clientInfo.getOsVersion(), AUDIT_UNKNOWN_TEXT);
    }

    /**
     * 解析设备类型。
     *
     * @param clientInfo 登录客户端信息
     * @return 设备类型
     */
    private LoginDeviceTypeEnum resolveDeviceType(LoginClientInfo clientInfo) {
        if (clientInfo == null) {
            return LoginDeviceTypeEnum.UNKNOWN;
        }
        if (clientInfo.getDeviceType() == null) {
            return LoginDeviceTypeEnum.UNKNOWN;
        }
        return clientInfo.getDeviceType();
    }

    /**
     * 规范化审计字符串字段，确保稳定非空。
     *
     * @param value        原始值
     * @param defaultValue 默认值
     * @return 规范化结果
     */
    private String normalizeAuditValue(String value, String defaultValue) {
        if (!StringUtils.hasText(value)) {
            return defaultValue;
        }
        return value.trim();
    }

    /**
     * 规范化审计用户名，避免写入空值。
     *
     * @param username 原始用户名
     * @return 非空用户名
     */
    private String resolveUsername(String username) {
        return normalizeAuditValue(username, "");
    }

    private CurrentInfoVo toCurrentInfoVo(CurrentAdmin currentAdmin) {
        return CurrentInfoVo.builder()
                .avatarId(currentAdmin.getAvatarId())
                .loginId(currentAdmin.getLoginId())
                .loginIp(currentAdmin.getLoginIp())
                .nickname(currentAdmin.getNickname())
                .tokenCreateTime(currentAdmin.getTokenCreateTime())
                .tenantId(currentAdmin.getTenantId())
                .userId(currentAdmin.getUserId())
                .username(currentAdmin.getUsername())
                .build();
    }

    private String normalizeNickname(String nickname) {
        String normalizedNickname = "";
        if (nickname != null) {
            normalizedNickname = nickname.trim();
        }
        if (!StringUtils.hasText(normalizedNickname)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户昵称不能为空");
        }
        return normalizedNickname;
    }

    private String normalizeAvatarId(String avatarId) {
        if (!StringUtils.hasText(avatarId)) {
            return "";
        }
        return avatarId.trim();
    }
}
