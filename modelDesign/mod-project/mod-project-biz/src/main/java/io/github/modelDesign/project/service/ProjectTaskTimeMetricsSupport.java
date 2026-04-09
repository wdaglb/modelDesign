package io.github.modelDesign.project.service;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * 任务时间指标支持类。
 */
@Component
public class ProjectTaskTimeMetricsSupport {
    /**
     * 解析创建任务时的负责人指派时间。
     *
     * @param assigneeId 负责人 ID
     * @param now 当前时间
     * @return 指派时间
     */
    public LocalDateTime resolveAssigneeAssignedAtOnCreate(Long assigneeId,
                                                           LocalDateTime now) {
        /**
         * 未分配负责人时不记录指派时间，避免接口返回误导性的负责人持续时长。
         */
        if (assigneeId == null || assigneeId.equals(0L)) {
            return null;
        }
        return now;
    }

    /**
     * 解析编辑任务时的负责人指派时间。
     *
     * @param previousAssigneeId 变更前负责人
     * @param currentAssigneeId 变更后负责人
     * @param previousAssignedAt 变更前指派时间
     * @param now 当前时间
     * @return 更新后的指派时间
     */
    public LocalDateTime resolveAssigneeAssignedAtOnEdit(Long previousAssigneeId,
                                                         Long currentAssigneeId,
                                                         LocalDateTime previousAssignedAt,
                                                         LocalDateTime now) {
        /**
         * 当前没有负责人时清空时间，保持“未指派”与“已指派但时长为 0”语义分离。
         */
        if (currentAssigneeId == null || currentAssigneeId.equals(0L)) {
            return null;
        }
        /**
         * 负责人未变化时保留原值，确保持续天数不会被无意义刷新。
         */
        if (Objects.equals(previousAssigneeId, currentAssigneeId)) {
            return previousAssignedAt;
        }
        return now;
    }

    /**
     * 计算开始时间到结束时间之间的自然日差值。
     *
     * @param startAt 开始时间
     * @param endAt 结束时间
     * @return 向下取整后的天数；没有开始时间时返回空值
     */
    public Integer calculateElapsedDays(LocalDateTime startAt,
                                        LocalDateTime endAt) {
        /**
         * 空值直接返回，交由上层接口显式表达“当前没有可展示的持续天数”。
         */
        if (startAt == null || endAt == null) {
            return null;
        }
        return Math.toIntExact(ChronoUnit.DAYS.between(startAt, endAt));
    }
}
