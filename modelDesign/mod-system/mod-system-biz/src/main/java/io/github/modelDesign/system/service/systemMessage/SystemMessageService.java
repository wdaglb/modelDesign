package io.github.modelDesign.system.service.systemMessage;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.api.dto.SystemMessageScopeType;
import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.mapper.SystemMessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * 系统消息服务。
 */
@Service
@RequiredArgsConstructor
public class SystemMessageService extends ServiceImpl<SystemMessageMapper, SystemMessage> implements IService<SystemMessage> {
    /**
     * 获取当前用户可见消息列表。
     *
     * @param currentUserId   当前用户 ID
     * @param currentTenantId 当前租户 ID
     * @return 消息列表
     */
    public List<SystemMessage> listVisibleMessages(Long currentUserId, Long currentTenantId) {
        return lambdaQuery()
                .eq(SystemMessage::getDeleted, 0)
                .and(wrapper -> {
                    wrapper.eq(SystemMessage::getReceiverUserId, currentUserId);
                    if (currentTenantId != null) {
                        wrapper.or(tenantWrapper -> tenantWrapper
                                .eq(SystemMessage::getScopeType, SystemMessageScopeType.TENANT.name())
                                .eq(SystemMessage::getTenantId, currentTenantId));
                    }
                    wrapper.or(platformWrapper -> platformWrapper
                            .eq(SystemMessage::getScopeType, SystemMessageScopeType.PLATFORM.name()));
                })
                .orderByDesc(SystemMessage::getCreateTime)
                .orderByDesc(SystemMessage::getId)
                .list();
    }

    /**
     * 获取当前用户可见消息详情。
     *
     * @param id              消息 ID
     * @param currentUserId   当前用户 ID
     * @param currentTenantId 当前租户 ID
     * @return 消息实体
     */
    public SystemMessage requireVisibleMessage(Long id, Long currentUserId, Long currentTenantId) {
        SystemMessage message = getById(id);
        if (message == null || !canAccess(message, currentUserId, currentTenantId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "消息不存在");
        }
        return message;
    }

    /**
     * 按关键字过滤消息。
     *
     * @param messages 消息列表
     * @param keyword  关键字
     * @return 过滤后的消息列表
     */
    public List<SystemMessage> filterByKeyword(List<SystemMessage> messages, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return messages;
        }
        List<SystemMessage> result = new ArrayList<>();
        for (SystemMessage message : messages) {
            if (matchesKeyword(message, keyword)) {
                result.add(message);
            }
        }
        return result;
    }

    /**
     * 提取消息 ID 集合。
     *
     * @param messages 消息列表
     * @return 消息 ID 列表
     */
    public List<Long> extractMessageIds(List<SystemMessage> messages) {
        List<Long> result = new ArrayList<>();
        for (SystemMessage message : messages) {
            if (message.getId() != null) {
                result.add(message.getId());
            }
        }
        return result;
    }

    /**
     * 规范化关键字。
     *
     * @param keyword 原始关键字
     * @return 规范化后的关键字
     */
    public String normalizeKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return keyword.trim();
    }

    /**
     * 判断消息是否已读。
     *
     * @param readMessageIdSet 已读消息 ID 集合
     * @param messageId        消息 ID
     * @return 是否已读
     */
    public boolean isRead(Set<Long> readMessageIdSet, Long messageId) {
        if (messageId == null) {
            return false;
        }
        return readMessageIdSet.contains(messageId);
    }

    private boolean canAccess(SystemMessage message, Long currentUserId, Long currentTenantId) {
        if (message == null) {
            return false;
        }
        if (message.getDeleted() != null && message.getDeleted().equals(1)) {
            return false;
        }
        if (SystemMessageScopeType.USER.name().equals(message.getScopeType())) {
            if (message.getReceiverUserId() == null) {
                return false;
            }
            return message.getReceiverUserId().equals(currentUserId);
        }
        if (SystemMessageScopeType.TENANT.name().equals(message.getScopeType())) {
            if (currentTenantId == null || message.getTenantId() == null) {
                return false;
            }
            return message.getTenantId().equals(currentTenantId);
        }
        return SystemMessageScopeType.PLATFORM.name().equals(message.getScopeType());
    }

    private boolean matchesKeyword(SystemMessage message, String keyword) {
        if (containsKeyword(message.getTitle(), keyword)) {
            return true;
        }
        if (containsKeyword(message.getContent(), keyword)) {
            return true;
        }
        return containsKeyword(message.getCategory(), keyword);
    }

    private boolean containsKeyword(String source, String keyword) {
        if (!StringUtils.hasText(source)) {
            return false;
        }
        return source.contains(keyword);
    }
}
