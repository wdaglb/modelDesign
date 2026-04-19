package io.github.modelDesign.project.api.dto;

import lombok.Data;

/**
 * 任务状态更新命令。
 */
@Data
public class ProjectTaskStatusUpdateCommand {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 目标状态编码。
     */
    private String status;
}
