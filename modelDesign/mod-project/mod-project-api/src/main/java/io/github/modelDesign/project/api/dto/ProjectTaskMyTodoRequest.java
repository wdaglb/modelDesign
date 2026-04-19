package io.github.modelDesign.project.api.dto;

import lombok.Data;

/**
 * 我的待办查询条件。
 */
@Data
public class ProjectTaskMyTodoRequest {
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
     * 优先级编码。
     */
    private String priority;

    /**
     * 状态编码。
     */
    private String status;
}
