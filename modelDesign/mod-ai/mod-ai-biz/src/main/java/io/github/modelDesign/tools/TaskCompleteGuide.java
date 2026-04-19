package io.github.modelDesign.tools;

import lombok.Builder;
import lombok.Data;

/**
 * 完成任务工具返回结果。
 */
@Data
@Builder
public class TaskCompleteGuide {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 任务标题。
     */
    private String taskTitle;

    /**
     * 完成前状态。
     */
    private String currentStatus;

    /**
     * 完成后状态。
     */
    private String targetStatus;

    /**
     * 写入的动态内容。
     */
    private String dynamicContent;

    /**
     * 建议的下一步动作。
     */
    private String nextAction;
}
