package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.auth.request.ChangePasswordRequest;
import io.github.modelDesign.auth.request.PasswordLoginRequest;
import io.github.modelDesign.auth.response.CurrentInfoVo;
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

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 认证服务。
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    /**
     * 管理员服务。
     */
    private final UserService userService;

    /**
     * 会话仓储。
     */
    private final SessionRepository sessionRepository;

    /**
     * JWT 服务。
     */
    private final TokenService tokenService;

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
        User user = userService.getByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号已被禁用");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }

        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarId(user.getAvatarId())
                .loginId(UUID.randomUUID().toString().replace("-", ""))
                .loginIp(resolveIp(httpRequest))
                .tokenCreateTime(LocalDateTime.now())
                .build();
        sessionRepository.save(currentAdmin);

        userService.lambdaUpdate()
                .eq(User::getId, user.getId())
                .set(User::getLastLoginIp, currentAdmin.getLoginIp())
                .set(User::getLastLoginTime, currentAdmin.getTokenCreateTime())
                .update();

        return UserLoginVo.builder()
                .token(tokenService.createToken(currentAdmin))
                .expireTime(tokenService.getExpireTime())
                .build();
    }

    /**
     * 获取当前登录用户信息。
     *
     * @return 当前登录用户信息
     */
    public CurrentInfoVo getCurrentInfo() {
        CurrentAdmin currentAdmin = AuthContext.get();
        return CurrentInfoVo.builder()
                .avatarId(currentAdmin.getAvatarId())
                .loginId(currentAdmin.getLoginId())
                .loginIp(currentAdmin.getLoginIp())
                .nickname(currentAdmin.getNickname())
                .tokenCreateTime(currentAdmin.getTokenCreateTime())
                .userId(currentAdmin.getUserId())
                .username(currentAdmin.getUsername())
                .build();
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
        return request.getRemoteAddr();
    }
}
