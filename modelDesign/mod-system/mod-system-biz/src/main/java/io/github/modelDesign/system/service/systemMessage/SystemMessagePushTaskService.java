package io.github.modelDesign.system.service.systemMessage;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import io.github.modelDesign.system.enums.SystemMessagePushTaskStatusEnum;
import io.github.modelDesign.system.mapper.SystemMessagePushTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 系统消息推送任务服务。
 */
@Service
@RequiredArgsConstructor
public class SystemMessagePushTaskService extends ServiceImpl<SystemMessagePushTaskMapper, SystemMessagePushTask> implements IService<SystemMessagePushTask> {
    /**
     * 保存推送任务集合。
     *
     * @param pushTasks 推送任务集合
     */
    public void savePushTasks(List<SystemMessagePushTask> pushTasks) {
        if (pushTasks == null || pushTasks.isEmpty()) {
            return;
        }
        boolean saved = saveBatch(pushTasks);
        if (!saved) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "保存消息推送任务失败");
        }
    }

    /**
     * 尝试锁定待处理推送任务。
     *
     * @param pushTaskId 推送任务 ID
     * @return 是否锁定成功
     */
    public boolean tryLockPendingTask(Long pushTaskId) {
        return lambdaUpdate()
                .eq(SystemMessagePushTask::getId, pushTaskId)
                .eq(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.PENDING.name())
                .set(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.PROCESSING.name())
                .update();
    }

    /**
     * 标记任务推送成功。
     *
     * @param pushTaskId 推送任务 ID
     */
    public void markSuccess(Long pushTaskId) {
        lambdaUpdate()
                .eq(SystemMessagePushTask::getId, pushTaskId)
                .set(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.SUCCESS.name())
                .set(SystemMessagePushTask::getLastError, "")
                .update();
    }

    /**
     * 标记任务待重试。
     *
     * @param pushTaskId     推送任务 ID
     * @param retryCount     重试次数
     * @param nextRetryTime  下次重试时间
     * @param lastError      错误信息
     */
    public void markRetry(Long pushTaskId, Integer retryCount, LocalDateTime nextRetryTime, String lastError) {
        lambdaUpdate()
                .eq(SystemMessagePushTask::getId, pushTaskId)
                .set(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.PENDING.name())
                .set(SystemMessagePushTask::getRetryCount, retryCount)
                .set(SystemMessagePushTask::getNextRetryTime, nextRetryTime)
                .set(SystemMessagePushTask::getLastError, lastError)
                .update();
    }

    /**
     * 标记任务推送失败。
     *
     * @param pushTaskId 推送任务 ID
     * @param retryCount 重试次数
     * @param lastError  错误信息
     */
    public void markFailed(Long pushTaskId, Integer retryCount, String lastError) {
        lambdaUpdate()
                .eq(SystemMessagePushTask::getId, pushTaskId)
                .set(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.FAILED.name())
                .set(SystemMessagePushTask::getRetryCount, retryCount)
                .set(SystemMessagePushTask::getNextRetryTime, null)
                .set(SystemMessagePushTask::getLastError, lastError)
                .update();
    }

    /**
     * 获取到期待重投任务列表。
     *
     * @param currentTime 当前时间
     * @param limit       最大数量
     * @return 推送任务列表
     */
    public List<SystemMessagePushTask> listDuePendingTasks(LocalDateTime currentTime, Integer limit) {
        if (limit == null || limit <= 0) {
            return Collections.emptyList();
        }
        return lambdaQuery()
                .eq(SystemMessagePushTask::getStatus, SystemMessagePushTaskStatusEnum.PENDING.name())
                .le(SystemMessagePushTask::getNextRetryTime, currentTime)
                .orderByAsc(SystemMessagePushTask::getNextRetryTime)
                .orderByAsc(SystemMessagePushTask::getId)
                .last("limit " + limit)
                .list();
    }
}
