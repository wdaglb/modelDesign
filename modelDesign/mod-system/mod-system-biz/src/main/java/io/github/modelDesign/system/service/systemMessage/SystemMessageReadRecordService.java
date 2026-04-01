package io.github.modelDesign.system.service.systemMessage;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.domain.SystemMessageReadRecord;
import io.github.modelDesign.system.mapper.SystemMessageReadRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 系统消息已读记录服务。
 */
@Service
@RequiredArgsConstructor
public class SystemMessageReadRecordService extends ServiceImpl<SystemMessageReadRecordMapper, SystemMessageReadRecord> implements IService<SystemMessageReadRecord> {
    /**
     * 获取已读时间映射。
     *
     * @param userId     用户 ID
     * @param messageIds 消息 ID 集合
     * @return 已读时间映射
     */
    public Map<Long, LocalDateTime> getReadTimeMap(Long userId, Collection<Long> messageIds) {
        List<Long> normalizedMessageIds = normalizeMessageIds(messageIds);
        if (normalizedMessageIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, LocalDateTime> result = new LinkedHashMap<>();
        List<SystemMessageReadRecord> readRecords = lambdaQuery()
                .eq(SystemMessageReadRecord::getUserId, userId)
                .in(SystemMessageReadRecord::getMessageId, normalizedMessageIds)
                .list();
        for (SystemMessageReadRecord readRecord : readRecords) {
            result.put(readRecord.getMessageId(), readRecord.getReadTime());
        }
        return result;
    }

    /**
     * 批量标记已读。
     *
     * @param userId     用户 ID
     * @param messageIds 消息 ID 集合
     * @return 新增的已读记录数量
     */
    public int markRead(Long userId, Collection<Long> messageIds) {
        List<Long> normalizedMessageIds = normalizeMessageIds(messageIds);
        if (normalizedMessageIds.isEmpty()) {
            return 0;
        }
        Map<Long, LocalDateTime> existingReadTimeMap = getReadTimeMap(userId, normalizedMessageIds);
        List<SystemMessageReadRecord> newReadRecords = new ArrayList<>();
        LocalDateTime currentTime = LocalDateTime.now();
        for (Long messageId : normalizedMessageIds) {
            if (existingReadTimeMap.containsKey(messageId)) {
                continue;
            }
            SystemMessageReadRecord readRecord = new SystemMessageReadRecord();
            readRecord.setMessageId(messageId);
            readRecord.setUserId(userId);
            readRecord.setReadTime(currentTime);
            newReadRecords.add(readRecord);
        }
        if (newReadRecords.isEmpty()) {
            return 0;
        }
        boolean saved = saveBatch(newReadRecords);
        if (!saved) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "保存消息已读记录失败");
        }
        return newReadRecords.size();
    }

    private List<Long> normalizeMessageIds(Collection<Long> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> normalizedIds = new LinkedHashSet<>();
        for (Long messageId : messageIds) {
            if (messageId == null) {
                continue;
            }
            if (messageId <= 0) {
                continue;
            }
            normalizedIds.add(messageId);
        }
        return new ArrayList<>(normalizedIds);
    }
}
