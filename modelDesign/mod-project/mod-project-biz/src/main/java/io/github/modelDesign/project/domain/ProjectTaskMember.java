package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 项目任务成员。
 */
@Data
@TableName("projectTaskMember")
@EqualsAndHashCode(callSuper = true)
public class ProjectTaskMember extends BaseEntity {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 用户 ID。
     */
    private Long userId;
}
