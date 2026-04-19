package io.github.modelDesign.project.api.dto;

import lombok.Data;

import java.util.List;

/**
 * 任务完成命令。
 */
@Data
public class ProjectTaskCompleteCommand {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 开发完成总结。
     */
    private String completionSummary;

    /**
     * 动态中 @ 的用户 ID 集合。
     */
    private List<Long> mentionedUserIds;
}
