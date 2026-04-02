package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务前置依赖关系。
 */
@Data
@TableName("projectTaskDependency")
@EqualsAndHashCode(callSuper = true)
public class ProjectTaskDependency extends BaseEntity {
    /**
     * 当前任务 ID。
     */
    private Long taskId;

    /**
     * 前置任务 ID。
     */
    private Long predecessorTaskId;
}
