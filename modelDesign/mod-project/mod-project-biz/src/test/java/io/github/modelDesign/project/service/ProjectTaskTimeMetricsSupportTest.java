package io.github.modelDesign.project.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * 任务时间指标支持类测试。
 */
class ProjectTaskTimeMetricsSupportTest {
    /**
     * 创建任务时存在负责人应记录当前指派时间。
     */
    @Test
    void resolveAssigneeAssignedAtOnCreateShouldReturnNowWhenAssigneePresent() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(now, support.resolveAssigneeAssignedAtOnCreate(18L, now));
        assertNull(support.resolveAssigneeAssignedAtOnCreate(null, now));
    }

    /**
     * 编辑任务时仅在负责人变化时重置指派时间。
     */
    @Test
    void resolveAssigneeAssignedAtOnEditShouldResetOnlyWhenAssigneeChanges() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime previousAssignedAt = LocalDateTime.of(2026, 4, 4, 9, 0, 0);
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(
                previousAssignedAt,
                support.resolveAssigneeAssignedAtOnEdit(7L, 7L,
                        previousAssignedAt, now)
        );
        assertEquals(
                now,
                support.resolveAssigneeAssignedAtOnEdit(null, 7L,
                        previousAssignedAt, now)
        );
        assertEquals(
                now,
                support.resolveAssigneeAssignedAtOnEdit(7L, 8L,
                        previousAssignedAt, now)
        );
        assertNull(support.resolveAssigneeAssignedAtOnEdit(7L, null,
                previousAssignedAt, now));
    }

    /**
     * 持续天数应按自然日向下取整。
     */
    @Test
    void calculateElapsedDaysShouldFloorToWholeDays() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(0, support.calculateElapsedDays(now.minusHours(5), now));
        assertEquals(3, support.calculateElapsedDays(now.minusDays(3), now));
        assertNull(support.calculateElapsedDays(null, now));
    }
}
