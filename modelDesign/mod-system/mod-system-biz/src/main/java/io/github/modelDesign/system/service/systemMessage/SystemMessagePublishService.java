package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.queue.systemMessage.SystemMessagePushProducer;
import io.github.modelDesign.system.api.dto.SystemMessagePublishCommand;
import io.github.modelDesign.system.api.dto.SystemMessageScopeType;
import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import io.github.modelDesign.system.enums.SystemMessagePushTaskStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 系统消息发布服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemMessagePublishService {
    /**
     * 消息服务。
     */
    private final SystemMessageService systemMessageService;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 推送任务服务。
     */
    private final SystemMessagePushTaskService systemMessagePushTaskService;

    /**
     * 推送适配器注册表。
     */
    private final SystemMessagePushAdapterRegistry systemMessagePushAdapterRegistry;

    /**
     * 推送事件生产者。
     */
    private final SystemMessagePushProducer systemMessagePushProducer;

    /**
     * 发布系统消息。
     *
     * @param command 发布命令
     */
    @Transactional(rollbackFor = Exception.class)
    public void publish(SystemMessagePublishCommand command) {
        if (command == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "消息发布命令不能为空");
        }
        SystemMessageScopeType scopeType = command.getScopeType();
        if (scopeType == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "消息作用域不能为空");
        }
        Long tenantId = normalizeTenantId(command.getTenantId());
        String category = normalizeRequiredText(command.getCategory(), 64, "消息分类不能为空", "消息分类长度不能超过 64 个字符");
        String title = normalizeRequiredText(command.getTitle(), 255, "消息标题不能为空", "消息标题长度不能超过 255 个字符");
        String content = normalizeRequiredContent(command.getContent());
        String redirectUrl = normalizeOptionalText(command.getRedirectUrl(), 500, "跳转地址长度不能超过 500 个字符");
        List<String> adapterCodes = systemMessagePushAdapterRegistry.resolvePublishAdapterCodes(command.getAdapterCodes());
        systemMessagePushAdapterRegistry.validateAdapterCodes(adapterCodes);
        List<SystemMessage> messages = buildMessages(scopeType, tenantId, command.getReceiverUserIds(), category, title, content, redirectUrl);
        boolean saved = systemMessageService.saveBatch(messages);
        if (!saved) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "保存系统消息失败");
        }
        List<SystemMessagePushTask> pushTasks = buildPushTasks(messages, adapterCodes);
        systemMessagePushTaskService.savePushTasks(pushTasks);
        registerPushDispatch(pushTasks);
    }

    private List<SystemMessage> buildMessages(
            SystemMessageScopeType scopeType,
            Long tenantId,
            Collection<Long> receiverUserIds,
            String category,
            String title,
            String content,
            String redirectUrl) {
        if (scopeType == SystemMessageScopeType.USER) {
            return buildUserMessages(tenantId, receiverUserIds, category, title, content, redirectUrl);
        }
        if (scopeType == SystemMessageScopeType.TENANT) {
            return List.of(buildTenantMessage(tenantId, receiverUserIds, category, title, content, redirectUrl));
        }
        return List.of(buildPlatformMessage(tenantId, receiverUserIds, category, title, content, redirectUrl));
    }

    private List<SystemMessage> buildUserMessages(
            Long tenantId,
            Collection<Long> receiverUserIds,
            String category,
            String title,
            String content,
            String redirectUrl) {
        List<Long> normalizedReceiverUserIds = normalizeReceiverUserIds(receiverUserIds);
        if (normalizedReceiverUserIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "个人消息接收用户不能为空");
        }
        validateReceiverUsers(normalizedReceiverUserIds);
        List<SystemMessage> messages = new ArrayList<>();
        for (Long receiverUserId : normalizedReceiverUserIds) {
            SystemMessage message = new SystemMessage();
            message.setScopeType(SystemMessageScopeType.USER.name());
            message.setTenantId(tenantId);
            message.setReceiverUserId(receiverUserId);
            message.setCategory(category);
            message.setTitle(title);
            message.setContent(content);
            message.setRedirectUrl(redirectUrl);
            message.setDeleted(0);
            messages.add(message);
        }
        return messages;
    }

    private SystemMessage buildTenantMessage(
            Long tenantId,
            Collection<Long> receiverUserIds,
            String category,
            String title,
            String content,
            String redirectUrl) {
        if (tenantId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户消息必须指定租户 ID");
        }
        List<Long> normalizedReceiverUserIds = normalizeReceiverUserIds(receiverUserIds);
        if (!normalizedReceiverUserIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户消息不能指定个人接收用户");
        }
        SystemMessage message = new SystemMessage();
        message.setScopeType(SystemMessageScopeType.TENANT.name());
        message.setTenantId(tenantId);
        message.setReceiverUserId(null);
        message.setCategory(category);
        message.setTitle(title);
        message.setContent(content);
        message.setRedirectUrl(redirectUrl);
        message.setDeleted(0);
        return message;
    }

    private SystemMessage buildPlatformMessage(
            Long tenantId,
            Collection<Long> receiverUserIds,
            String category,
            String title,
            String content,
            String redirectUrl) {
        if (tenantId != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "平台消息不能指定租户 ID");
        }
        List<Long> normalizedReceiverUserIds = normalizeReceiverUserIds(receiverUserIds);
        if (!normalizedReceiverUserIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "平台消息不能指定个人接收用户");
        }
        SystemMessage message = new SystemMessage();
        message.setScopeType(SystemMessageScopeType.PLATFORM.name());
        message.setTenantId(null);
        message.setReceiverUserId(null);
        message.setCategory(category);
        message.setTitle(title);
        message.setContent(content);
        message.setRedirectUrl(redirectUrl);
        message.setDeleted(0);
        return message;
    }

    private void validateReceiverUsers(List<Long> receiverUserIds) {
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(receiverUserIds);
        if (userMap.size() != receiverUserIds.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "部分接收用户不存在");
        }
    }

    List<SystemMessagePushTask> buildPushTasks(List<SystemMessage> messages, List<String> adapterCodes) {
        if (adapterCodes.isEmpty()) {
            return new ArrayList<>();
        }
        List<SystemMessagePushTask> pushTasks = new ArrayList<>();
        LocalDateTime currentTime = LocalDateTime.now();
        for (SystemMessage message : messages) {
            for (String adapterCode : adapterCodes) {
                SystemMessagePushTask pushTask = new SystemMessagePushTask();
                pushTask.setMessageId(message.getId());
                pushTask.setAdapterCode(adapterCode);
                pushTask.setStatus(SystemMessagePushTaskStatusEnum.PENDING.name());
                pushTask.setRetryCount(0);
                pushTask.setNextRetryTime(currentTime);
                pushTask.setLastError("");
                pushTask.setTenantId(message.getTenantId());
                pushTask.setReceiverUserId(message.getReceiverUserId());
                pushTasks.add(pushTask);
            }
        }
        return pushTasks;
    }

    private void registerPushDispatch(List<SystemMessagePushTask> pushTasks) {
        if (pushTasks == null || pushTasks.isEmpty()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatchPushTasks(pushTasks);
                }
            });
            return;
        }
        dispatchPushTasks(pushTasks);
    }

    private void dispatchPushTasks(List<SystemMessagePushTask> pushTasks) {
        for (SystemMessagePushTask pushTask : pushTasks) {
            try {
                systemMessagePushProducer.publishTask(pushTask.getId(), pushTask.getMessageId(), pushTask.getAdapterCode());
            } catch (Exception exception) {
                log.error("系统消息推送事件投递失败，pushTaskId={}", pushTask.getId(), exception);
            }
        }
    }

    private Long normalizeTenantId(Long tenantId) {
        if (tenantId == null) {
            return null;
        }
        if (tenantId <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户 ID 必须大于 0");
        }
        return tenantId;
    }

    private List<Long> normalizeReceiverUserIds(Collection<Long> receiverUserIds) {
        if (receiverUserIds == null || receiverUserIds.isEmpty()) {
            return new ArrayList<>();
        }
        Set<Long> normalizedIds = new LinkedHashSet<>();
        for (Long receiverUserId : receiverUserIds) {
            if (receiverUserId == null || receiverUserId <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "接收用户 ID 必须大于 0");
            }
            normalizedIds.add(receiverUserId);
        }
        return new ArrayList<>(normalizedIds);
    }

    private String normalizeRequiredText(String value, int maxLength, String blankMessage, String maxLengthMessage) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), blankMessage);
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), maxLengthMessage);
        }
        return normalizedValue;
    }

    private String normalizeRequiredContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "消息内容不能为空");
        }
        return content.trim();
    }

    private String normalizeOptionalText(String value, int maxLength, String maxLengthMessage) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), maxLengthMessage);
        }
        return normalizedValue;
    }
}
