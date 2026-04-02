package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 项目。
 */
@Data
@TableName("project")
@EqualsAndHashCode(callSuper = true)
public class Project extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 项目编号。
     */
    private String code;

    /**
     * 项目名称。
     */
    private String name;

    /**
     * 项目描述。
     */
    private String description;

    /**
     * 数据库类型。
     */
    private String dbType;

    /**
     * 项目状态。
     */
    private String status;

    /**
     * 项目分组。
     */
    private String projectGroup;

    /**
     * 当前进展。
     */
    private String progressSummary;

    /**
     * 已完成模块数。
     */
    private Integer completedModuleCount;

    /**
     * 创建人 ID。
     */
    private Long creatorId;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
