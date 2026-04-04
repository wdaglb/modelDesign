package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.request.LoginAuditPageRequest;
import io.github.modelDesign.auth.response.LoginAuditPageItemVo;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.service.UserLoginHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}
