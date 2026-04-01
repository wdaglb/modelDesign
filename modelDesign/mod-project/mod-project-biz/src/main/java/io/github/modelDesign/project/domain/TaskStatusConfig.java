package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务状态配置。
 */
@Data
@TableName("taskStatusConfig")
@EqualsAndHashCode(callSuper = true)
public class TaskStatusConfig extends BaseEntity {
    /**
     * 状态编码。
     */
    private String code;

    /**
     * 状态名称。
     */
    private String name;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 是否为完成状态。
     */
    private Boolean isCompleted;
}
