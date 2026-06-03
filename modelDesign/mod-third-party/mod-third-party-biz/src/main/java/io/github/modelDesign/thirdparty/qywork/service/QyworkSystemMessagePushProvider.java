package io.github.modelDesign.thirdparty.qywork.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.api.SystemMessagePushAdapter;
import io.github.modelDesign.system.api.dto.SystemMessagePushContext;
import io.github.modelDesign.thirdparty.oauth.domain.UserOauth;
import io.github.modelDesign.thirdparty.oauth.service.UserOauthService;
import io.github.modelDesign.thirdparty.qywork.client.QyworkMessageClient;
import io.github.modelDesign.thirdparty.qywork.client.QyworkMessageSendRequest;
import io.github.modelDesign.thirdparty.qywork.domain.QyworkCorpConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 企业微信系统消息推送 provider。
 *
 * <p>该 provider 只处理企业微信通道：接收人解析、消息体组装、access token 获取
 * 和 message/send 调用都在本通道内完成。未绑定用户直接跳过，企业微信接口失败
 * 只影响当前 qywork 推送任务，不能影响站内消息或其它 provider。</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QyworkSystemMessagePushProvider implements SystemMessagePushAdapter {
    private static final String ADAPTER_CODE = "qywork";
    private static final String PROVIDER_QYWORK = "qywork";
    private static final String MESSAGE_TYPE_MARKDOWN = "markdown";

    /**
     * 第三方账号绑定服务。
     */
    private final UserOauthService userOauthService;

    /**
     * 企业微信配置服务。
     */
    private final QyworkCorpConfigService qyworkCorpConfigService;

    /**
     * 企业微信 access token 服务。
     */
    private final QyworkAccessTokenService qyworkAccessTokenService;

    /**
     * 企业微信消息客户端。
     */
    private final QyworkMessageClient qyworkMessageClient;

    /**
     * Markdown 内容构建器。
     */
    private final QyworkMarkdownMessageBuilder qyworkMarkdownMessageBuilder;

    @Override
    public String getAdapterCode() {
        return ADAPTER_CODE;
    }

    @Override
    public void push(SystemMessagePushContext context) {
        validateContext(context);
        QyworkCorpConfig config = qyworkCorpConfigService.requireByTenantId(context.getTenantId());
        Integer agentId = resolveAgentId(config);
        for (Long receiverUserId : context.getReceiverUserIds()) {
            pushToReceiver(context, config, agentId, receiverUserId);
        }
    }

    private void pushToReceiver(
            SystemMessagePushContext context,
            QyworkCorpConfig config,
            Integer agentId,
            Long receiverUserId
    ) {
        UserOauth binding = userOauthService.findActiveByUser(
                context.getTenantId(),
                receiverUserId,
                PROVIDER_QYWORK
        );
        if (binding == null || !StringUtils.hasText(binding.getProviderUserId())) {
            log.info(
                    "用户未绑定企业微信，跳过企业微信系统消息推送，messageId={}，tenantId={}，userId={}",
                    context.getMessageId(),
                    context.getTenantId(),
                    receiverUserId
            );
            return;
        }
        String markdownContent = qyworkMarkdownMessageBuilder.buildSystemMessageMarkdown(
                context.getTitle(),
                context.getContent(),
                context.getRedirectUrl()
        );
        String accessToken = qyworkAccessTokenService.getAccessToken(context.getTenantId(), false);
        qyworkMessageClient.sendMessage(
                accessToken,
                buildMarkdownRequest(binding.getProviderUserId(), agentId, markdownContent)
        );
    }

    private QyworkMessageSendRequest buildMarkdownRequest(String providerUserId, Integer agentId, String markdownContent) {
        return QyworkMessageSendRequest.builder()
                .toUser(providerUserId)
                .msgType(MESSAGE_TYPE_MARKDOWN)
                .agentId(agentId)
                .markdown(QyworkMessageSendRequest.Markdown.builder()
                        .content(markdownContent)
                        .build())
                .build();
    }

    private void validateContext(SystemMessagePushContext context) {
        if (context == null || context.getTenantId() == null || context.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信推送缺少有效租户 ID");
        }
        List<Long> receiverUserIds = context.getReceiverUserIds();
        if (receiverUserIds == null || receiverUserIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信推送缺少接收用户");
        }
    }

    private Integer resolveAgentId(QyworkCorpConfig config) {
        if (config == null || !StringUtils.hasText(config.getAgentId())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信应用 ID 未配置");
        }
        try {
            int agentId = Integer.parseInt(config.getAgentId().trim());
            if (agentId <= 0) {
                throw new NumberFormatException("agentId must be positive");
            }
            return agentId;
        } catch (NumberFormatException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), "企业微信应用 ID 配置错误");
        }
    }
}
