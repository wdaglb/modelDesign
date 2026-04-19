package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 任务类型结果。
 */
@Data
@Builder
public class ProjectTaskTypeDto {
    /**
     * 类型 ID。
     */
    private Long id;

    /**
     * 类型名称。
     */
    private String name;

    /**
     * 排序值。
     */
    private Integer sort;
}
