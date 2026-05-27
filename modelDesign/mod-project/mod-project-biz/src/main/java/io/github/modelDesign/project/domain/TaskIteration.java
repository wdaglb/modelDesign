package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 任务迭代。
 *
 * 迭代按租户隔离，供敏捷面板和任务显式绑定使用。
 */
@Data
@TableName("taskIteration")
@EqualsAndHashCode(callSuper = true)
public class TaskIteration extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 迭代名称。
     */
    private String name;

    /**
     * 开始日期。
     */
    private LocalDate startDate;

    /**
     * 结束日期。
     */
    private LocalDate endDate;

    /**
     * 是否已发布。
     */
    private Boolean published;
}
