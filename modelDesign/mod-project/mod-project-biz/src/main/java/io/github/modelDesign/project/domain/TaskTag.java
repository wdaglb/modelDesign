package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务标签。
 */
@Data
@TableName("taskTag")
@EqualsAndHashCode(callSuper = true)
public class TaskTag extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 标签名称。
     */
    private String name;

    /**
     * 标签颜色。
     */
    private String color;

    /**
     * 排序值。
     */
    private Integer sort;
}
