package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.enums.SystemMessageReadStatusEnum;
import io.github.modelDesign.system.request.SystemMessageListRequest;
import io.github.modelDesign.system.request.SystemMessageReadAllRequest;
import io.github.modelDesign.system.request.SystemMessageReadRequest;
import io.github.modelDesign.system.response.PageResponse;
import io.github.modelDesign.system.response.SystemMessageDetailVo;
import io.github.modelDesign.system.response.SystemMessageListItemVo;
import io.github.modelDesign.system.response.SystemMessageUnreadCountVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 系统消息中心服务。
 */
@Service
@RequiredArgsConstructor
public class SystemMessageCenterService {
    /**
     * 系统消息服务。
     */
    private final SystemMessageService systemMessageService;

    /**
     * 系统消息已读记录服务。
     */
    private final SystemMessageReadRecordService systemMessageReadRecordService;

    /**
     * 系统消息当前用户上下文服务。
     */
    private final SystemMessageCurrentUserContextService systemMessageCurrentUserContextService;

    /**
     * 系统消息视图组装器。
     */
    private final SystemMessageViewAssembler systemMessageViewAssembler;

    /**
     * 获取当前用户消息列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<SystemMessageListItemVo> getList(SystemMessageListRequest request) {
        Long currentUserId = systemMessageCurrentUserContextService.requireCurrentUserId();
        Long currentTenantId = systemMessageCurrentUserContextService.getCurrentTenantId();
        String keyword = systemMessageService.normalizeKeyword(request.getKeyword());
        SystemMessageReadStatusEnum readStatus = SystemMessageReadStatusEnum.fromValue(request.getReadStatus());
        List<SystemMessage> filteredMessages = getFilteredMessages(currentUserId, currentTenantId, keyword, readStatus);
        Map<Long, LocalDateTime> readTimeMap = systemMessageReadRecordService.getReadTimeMap(currentUserId, systemMessageService.extractMessageIds(filteredMessages));
        long total = filteredMessages.size();
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        long fromIndex = Math.max((current - 1L) * pageSize, 0L);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<SystemMessage> pageMessages = filteredMessages.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(systemMessageViewAssembler.toListItemList(pageMessages, readTimeMap), total);
    }

    /**
     * 获取当前用户消息详情。
     *
     * @param id 消息 ID
     * @return 消息详情
     */
    public SystemMessageDetailVo getDetail(Long id) {
        Long currentUserId = systemMessageCurrentUserContextService.requireCurrentUserId();
        Long currentTenantId = systemMessageCurrentUserContextService.getCurrentTenantId();
        SystemMessage message = systemMessageService.requireVisibleMessage(id, currentUserId, currentTenantId);
        Map<Long, LocalDateTime> readTimeMap = systemMessageReadRecordService.getReadTimeMap(currentUserId, List.of(id));
        LocalDateTime readTime = readTimeMap.get(id);
        if (readTime == null) {
            readTime = markDetailAsRead(currentUserId, id);
        }
        return systemMessageViewAssembler.toDetailVo(message, readTime);
    }

    /**
     * 获取当前用户未读数量。
     *
     * @return 未读数量
     */
    public SystemMessageUnreadCountVo getUnreadCount() {
        Long currentUserId = systemMessageCurrentUserContextService.requireCurrentUserId();
        Long currentTenantId = systemMessageCurrentUserContextService.getCurrentTenantId();
        List<SystemMessage> visibleMessages = systemMessageService.listVisibleMessages(currentUserId, currentTenantId);
        if (visibleMessages.isEmpty()) {
            return new SystemMessageUnreadCountVo(0L);
        }
        Map<Long, LocalDateTime> readTimeMap = systemMessageReadRecordService.getReadTimeMap(currentUserId, systemMessageService.extractMessageIds(visibleMessages));
        long unreadCount = visibleMessages.size() - readTimeMap.size();
        return new SystemMessageUnreadCountVo(unreadCount);
    }

    /**
     * 标记单条消息已读。
     *
     * @param request 已读请求
     * @return 新增已读数量
     */
    public Integer read(SystemMessageReadRequest request) {
        Long currentUserId = systemMessageCurrentUserContextService.requireCurrentUserId();
        Long currentTenantId = systemMessageCurrentUserContextService.getCurrentTenantId();
        systemMessageService.requireVisibleMessage(request.getId(), currentUserId, currentTenantId);
        return systemMessageReadRecordService.markRead(currentUserId, List.of(request.getId()));
    }

    /**
     * 按当前筛选条件全部标记已读。
     *
     * @param request 全部已读请求
     * @return 新增已读数量
     */
    public Integer readAll(SystemMessageReadAllRequest request) {
        Long currentUserId = systemMessageCurrentUserContextService.requireCurrentUserId();
        Long currentTenantId = systemMessageCurrentUserContextService.getCurrentTenantId();
        String keyword = systemMessageService.normalizeKeyword(request.getKeyword());
        SystemMessageReadStatusEnum readStatus = SystemMessageReadStatusEnum.fromValue(request.getReadStatus());
        List<SystemMessage> filteredMessages = getFilteredMessages(currentUserId, currentTenantId, keyword, readStatus);
        if (filteredMessages.isEmpty()) {
            return 0;
        }
        return systemMessageReadRecordService.markRead(currentUserId, systemMessageService.extractMessageIds(filteredMessages));
    }

    private List<SystemMessage> getFilteredMessages(
            Long currentUserId,
            Long currentTenantId,
            String keyword,
            SystemMessageReadStatusEnum readStatus) {
        List<SystemMessage> visibleMessages = systemMessageService.listVisibleMessages(currentUserId, currentTenantId);
        List<SystemMessage> keywordFilteredMessages = systemMessageService.filterByKeyword(visibleMessages, keyword);
        if (keywordFilteredMessages.isEmpty()) {
            return keywordFilteredMessages;
        }
        Map<Long, LocalDateTime> readTimeMap = systemMessageReadRecordService.getReadTimeMap(currentUserId, systemMessageService.extractMessageIds(keywordFilteredMessages));
        return filterByReadStatus(keywordFilteredMessages, readTimeMap.keySet(), readStatus);
    }

    private LocalDateTime markDetailAsRead(Long currentUserId, Long messageId) {
        LocalDateTime currentTime = LocalDateTime.now();
        int markedCount = systemMessageReadRecordService.markRead(currentUserId, List.of(messageId));
        if (markedCount > 0) {
            return currentTime;
        }
        Map<Long, LocalDateTime> refreshedReadTimeMap = systemMessageReadRecordService.getReadTimeMap(currentUserId, List.of(messageId));
        LocalDateTime readTime = refreshedReadTimeMap.get(messageId);
        if (readTime == null) {
            return currentTime;
        }
        return readTime;
    }

    private List<SystemMessage> filterByReadStatus(
            List<SystemMessage> messages,
            Set<Long> readMessageIdSet,
            SystemMessageReadStatusEnum readStatus) {
        if (readStatus == null) {
            return messages;
        }
        List<SystemMessage> result = new ArrayList<>();
        for (SystemMessage message : messages) {
            boolean isRead = systemMessageService.isRead(readMessageIdSet, message.getId());
            if (readStatus == SystemMessageReadStatusEnum.READ && isRead) {
                result.add(message);
                continue;
            }
            if (readStatus == SystemMessageReadStatusEnum.UNREAD && !isRead) {
                result.add(message);
            }
        }
        return result;
    }
}
