package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 项目成员。
 */
@Data
@TableName("projectMember")
@EqualsAndHashCode(callSuper = true)
public class ProjectMember extends BaseEntity {
    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 用户 ID。
     */
    private Long userId;
}
