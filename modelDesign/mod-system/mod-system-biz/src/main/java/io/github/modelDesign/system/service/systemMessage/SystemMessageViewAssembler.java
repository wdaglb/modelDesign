package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.response.SystemMessageDetailVo;
import io.github.modelDesign.system.response.SystemMessageListItemVo;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 系统消息视图组装器。
 */
@Component
public class SystemMessageViewAssembler {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 转换列表响应集合。
     *
     * @param messages    消息列表
     * @param readTimeMap 已读时间映射
     * @return 列表响应
     */
    public List<SystemMessageListItemVo> toListItemList(List<SystemMessage> messages, Map<Long, LocalDateTime> readTimeMap) {
        List<SystemMessageListItemVo> result = new ArrayList<>();
        for (SystemMessage message : messages) {
            LocalDateTime readTime = readTimeMap.get(message.getId());
            result.add(toListItem(message, readTime));
        }
        return result;
    }

    /**
     * 转换列表项响应。
     *
     * @param message  消息实体
     * @param readTime 已读时间
     * @return 列表项响应
     */
    public SystemMessageListItemVo toListItem(SystemMessage message, LocalDateTime readTime) {
        return SystemMessageListItemVo.builder()
                .id(message.getId())
                .scopeType(message.getScopeType())
                .tenantId(message.getTenantId())
                .receiverUserId(message.getReceiverUserId())
                .category(message.getCategory())
                .title(message.getTitle())
                .content(message.getContent())
                .redirectUrl(message.getRedirectUrl())
                .isRead(resolveReadFlag(readTime))
                .readAt(formatDateTime(readTime))
                .createdAt(formatDateTime(message.getCreateTime()))
                .build();
    }

    /**
     * 转换详情响应。
     *
     * @param message  消息实体
     * @param readTime 已读时间
     * @return 详情响应
     */
    public SystemMessageDetailVo toDetailVo(SystemMessage message, LocalDateTime readTime) {
        return SystemMessageDetailVo.builder()
                .id(message.getId())
                .scopeType(message.getScopeType())
                .tenantId(message.getTenantId())
                .receiverUserId(message.getReceiverUserId())
                .category(message.getCategory())
                .title(message.getTitle())
                .content(message.getContent())
                .redirectUrl(message.getRedirectUrl())
                .isRead(resolveReadFlag(readTime))
                .readAt(formatDateTime(readTime))
                .createdAt(formatDateTime(message.getCreateTime()))
                .build();
    }

    private Boolean resolveReadFlag(LocalDateTime readTime) {
        if (readTime == null) {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
