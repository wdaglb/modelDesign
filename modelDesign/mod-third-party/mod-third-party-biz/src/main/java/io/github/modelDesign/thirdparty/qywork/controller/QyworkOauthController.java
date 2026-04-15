package io.github.modelDesign.thirdparty.qywork.controller;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.thirdparty.qywork.service.QyworkOauthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.view.RedirectView;

/**
 * 企业微信 OAuth 页面型接口。
 */
@Tag(name = "企业微信 OAuth")
@Controller
@RequiredArgsConstructor
@RequestMapping("/third-party/qywork")
public class QyworkOauthController {
    private final QyworkOauthService qyworkOauthService;

    @Operation(summary = "企业微信扫码中转入口")
    @IgnorePermission
    @GetMapping("/binding/scan-entry")
    public RedirectView scanEntry(@RequestParam("sceneToken") String sceneToken) {
        return new RedirectView(qyworkOauthService.buildAuthorizeUrlBySceneToken(sceneToken));
    }

    @Operation(summary = "企业微信 OAuth 回调")
    @IgnorePermission
    @GetMapping(value = "/oauth/callback", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String callback(
            @RequestParam("code") String code,
            @RequestParam("state") String state
    ) {
        return qyworkOauthService.handleCallback(code, state);
    }
}
