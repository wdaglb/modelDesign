package io.github.modelDesign.project.api.dto;

import lombok.Data;

/**
 * 项目任务列表查询条件。
 */
@Data
public class ProjectTaskQueryRequest {
    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 当前页码。
     */
    private Integer current = 1;

    /**
     * 每页条数。
     */
    private Integer pageSize = 10;

    /**
     * 标题关键字。
     */
    private String title;

    /**
     * 任务类型 ID。
     */
    private Long typeId;

    /**
     * 状态编码。
     */
    private String status;

    /**
     * 优先级编码。
     */
    private String priority;

    /**
     * 负责人 ID。
     */
    private Long assigneeId;

    /**
     * 排序字段。
     */
    private String sortField;

    /**
     * 排序方向。
     */
    private String sortOrder;
}
