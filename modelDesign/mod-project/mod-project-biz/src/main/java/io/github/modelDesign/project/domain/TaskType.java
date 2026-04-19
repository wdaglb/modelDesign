package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务类型。
 */
@Data
@TableName("taskType")
@EqualsAndHashCode(callSuper = true)
public class TaskType extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 类型名称。
     */
    private String name;

    /**
     * 排序值。
     */
    private Integer sort;
}
