package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 我的待办结果。
 */
@Data
@Builder
public class MyTodoTaskDto {
    /**
     * 任务 ID。
     */
    private Long id;

    /**
     * 标题。
     */
    private String title;

    /**
     * 最新动态摘要。
     */
    private String latestDynamicSummary;

    /**
     * 接收时间。
     */
    private String receivedAt;

    /**
     * 优先级编码。
     */
    private String priority;

    /**
     * 预计工时。
     */
    private BigDecimal workDays;

    /**
     * 状态编码。
     */
    private String status;

    /**
     * 发起人名称。
     */
    private String initiatorName;

    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 项目名称。
     */
    private String projectName;
}
