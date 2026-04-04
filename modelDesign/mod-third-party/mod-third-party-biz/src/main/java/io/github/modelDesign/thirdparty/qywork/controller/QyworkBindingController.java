package io.github.modelDesign.thirdparty.qywork.controller;

import io.github.modelDesign.thirdparty.qywork.request.CreateOauthBindingSessionRequest;
import io.github.modelDesign.thirdparty.qywork.response.OauthBindingSessionCreatedVo;
import io.github.modelDesign.thirdparty.qywork.response.OauthBindingSessionStatusVo;
import io.github.modelDesign.thirdparty.qywork.response.UserOauthBindingStatusVo;
import io.github.modelDesign.thirdparty.qywork.service.QyworkOauthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 企业微信绑定接口。
 */
@Tag(name = "企业微信绑定")
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/third-party/qywork/binding")
public class QyworkBindingController {
    private final QyworkOauthService qyworkOauthService;

    @Operation(summary = "获取当前用户企业微信绑定状态")
    @GetMapping("/current")
    public UserOauthBindingStatusVo current() {
        return qyworkOauthService.getCurrentBindingStatus();
    }

    @Operation(summary = "创建企业微信绑定会话")
    @PostMapping("/session")
    public OauthBindingSessionCreatedVo createSession(@Valid @RequestBody CreateOauthBindingSessionRequest request) {
        return qyworkOauthService.createBindingSession(request);
    }

    @Operation(summary = "查询企业微信绑定会话状态")
    @GetMapping("/session/{sessionId}")
    public OauthBindingSessionStatusVo session(@PathVariable("sessionId") String sessionId) {
        return qyworkOauthService.getBindingSessionStatus(sessionId);
    }
}
