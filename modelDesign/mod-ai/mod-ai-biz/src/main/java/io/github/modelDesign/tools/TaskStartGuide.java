package io.github.modelDesign.tools;

import lombok.Builder;
import lombok.Data;

/**
 * 开始任务工具返回结果。
 */
@Data
@Builder
public class TaskStartGuide {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 任务标题。
     */
    private String taskTitle;

    /**
     * 当前任务状态。
     */
    private String currentStatus;

    /**
     * 执行工具后的任务状态。
     */
    private String targetStatus;

    /**
     * 是否允许开始任务。
     */
    private Boolean canStart;

    /**
     * 阻塞原因。
     */
    private String blockedReason;

    /**
     * 推荐分支名。
     */
    private String recommendedBranchName;

    /**
     * 推荐分支命令。
     */
    private String recommendedBranchCommand;

    /**
     * 建议的下一步动作。
     */
    private String nextAction;
}
