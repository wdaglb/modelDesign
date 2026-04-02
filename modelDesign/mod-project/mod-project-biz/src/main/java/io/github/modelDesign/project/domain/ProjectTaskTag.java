package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务与标签绑定关系。
 */
@Data
@TableName("projectTaskTag")
@EqualsAndHashCode(callSuper = true)
public class ProjectTaskTag extends BaseEntity {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 标签 ID。
     */
    private Long tagId;
}
