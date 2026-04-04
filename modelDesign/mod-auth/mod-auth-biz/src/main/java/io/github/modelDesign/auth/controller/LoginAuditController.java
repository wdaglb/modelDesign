package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.enums.LoginAuditCleanupScopeEnum;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.request.LoginAuditCleanupRequest;
import io.github.modelDesign.auth.request.LoginAuditPageRequest;
import io.github.modelDesign.auth.response.LoginAuditCleanupResultVo;
import io.github.modelDesign.auth.response.LoginAuditPageItemVo;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.service.LoginAuditCleanupService;
import io.github.modelDesign.auth.service.UserLoginHistoryService;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录审计管理接口。
 */
@Tag(name = "登录审计管理")
@RestController
@RequestMapping("/login_audit")
@RequiredArgsConstructor
@Validated
public class LoginAuditController {
    /**
     * 登录历史服务。
     */
    private final UserLoginHistoryService userLoginHistoryService;

    /**
     * 登录审计清理服务。
     */
    private final LoginAuditCleanupService loginAuditCleanupService;

    /**
     * 分页查询登录审计记录。
     *
     * @param request 分页请求
     * @return 分页结果
     */
    @Operation(summary = "分页查询登录审计记录")
    @GetMapping("/page")
    public PageResponse<LoginAuditPageItemVo> page(@Valid LoginAuditPageRequest request) {
        return userLoginHistoryService.getLoginAuditPage(request);
    }

    /**
     * 手动清理登录审计日志。
     *
     * @param request 清理请求
     * @return 清理结果
     */
    @Operation(summary = "清理登录审计日志")
    @PostMapping("/cleanup")
    public LoginAuditCleanupResultVo cleanup(
            @Valid @RequestBody LoginAuditCleanupRequest request
    ) {
        requireCleanupRequest(request);
        CurrentAdmin currentAdmin = requireCurrentAdmin();
        if (LoginAuditCleanupScopeEnum.GLOBAL.equals(request.getScope())) {
            return loginAuditCleanupService.cleanupGlobal(
                    request.getRetentionDays(),
                    currentAdmin.getUserId(),
                    currentAdmin.getTenantId(),
                    LoginAuditCleanupTriggerTypeEnum.MANUAL
            );
        }
        return loginAuditCleanupService.cleanupByTenant(
                request.getTenantId(),
                request.getRetentionDays(),
                currentAdmin.getUserId(),
                currentAdmin.getTenantId(),
                LoginAuditCleanupTriggerTypeEnum.MANUAL
        );
    }

    /**
     * 校验清理请求的条件必填项。
     *
     * @param request 清理请求
     */
    private void requireCleanupRequest(LoginAuditCleanupRequest request) {
        if (request == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "请求参数不能为空");
        }
        if (LoginAuditCleanupScopeEnum.TENANT.equals(request.getScope())
                && request.getTenantId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不能为空");
        }
    }

    /**
     * 获取当前登录上下文，不存在则拒绝操作。
     *
     * @return 当前登录用户
     */
    private CurrentAdmin requireCurrentAdmin() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录");
        }
        return currentAdmin;
    }
}
