package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.ChangePasswordRequest;
import io.github.modelDesign.auth.request.PasswordLoginRequest;
import io.github.modelDesign.auth.response.CurrentInfoVo;
import io.github.modelDesign.auth.response.CurrentPermissionVo;
import io.github.modelDesign.auth.response.UserLoginVo;
import io.github.modelDesign.auth.service.AuthService;
import io.github.modelDesign.auth.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录与当前用户接口。
 */
@Tag(name = "认证授权")
@RestController
@RequestMapping("/passport")
@RequiredArgsConstructor
public class PassportController {
    /**
     * 认证服务。
     */
    private final AuthService authService;

    /**
     * 权限服务。
     */
    private final PermissionService permissionService;

    /**
     * 用户名密码登录。
     *
     * @param request     登录请求
     * @param httpRequest HTTP 请求
     * @return 登录响应
     */
    @Operation(summary = "用户名密码登录")
    @PostMapping("/password_login")
    public UserLoginVo passwordLogin(@Valid @RequestBody PasswordLoginRequest request,
                                     HttpServletRequest httpRequest) {
        return authService.passwordLogin(request, httpRequest);
    }

    /**
     * 获取当前登录用户信息。
     *
     * @return 当前登录用户信息
     */
    @Operation(summary = "获取当前登录用户信息")
    @GetMapping("/current_info")
    public CurrentInfoVo currentInfo() {
        return authService.getCurrentInfo();
    }

    /**
     * 获取当前登录用户菜单权限。
     *
     * @return 当前登录用户菜单权限
     */
    @Operation(summary = "获取当前登录用户菜单权限")
    @GetMapping("/current_permission")
    public CurrentPermissionVo currentPermission() {
        return permissionService.getCurrentPermission();
    }

    /**
     * 修改当前登录用户密码。
     *
     * @param request 修改密码请求
     */
    @Operation(summary = "修改当前登录用户密码")
    @PostMapping("/change_password")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
    }

    /**
     * 注销当前登录。
     */
    @Operation(summary = "注销当前登录")
    @PostMapping("/logout")
    public void logout() {
        authService.logout();
    }
}
