package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务动态。
 */
@Data
@TableName("projectTaskDynamic")
@EqualsAndHashCode(callSuper = true)
public class ProjectTaskDynamic extends BaseEntity {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 动态内容。
     */
    private String content;

    /**
     * 发布人 ID。
     */
    private Long operatorId;
}
