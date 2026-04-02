package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import io.github.modelDesign.project.support.ProjectTaskChangeContentItem;
import io.github.modelDesign.project.support.ProjectTaskChangeLogContentTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 任务变更日志。
 */
@Data
@TableName(value = "projectTaskChangeLog", autoResultMap = true)
@EqualsAndHashCode(callSuper = true)
public class ProjectTaskChangeLog extends BaseEntity {
    /**
     * 任务 ID。
     */
    private Long taskId;

    /**
     * 操作类型。
     */
    private String operationType;

    /**
     * 操作人 ID。
     */
    private Long operatorId;

    /**
     * 变更内容。
     */
    @TableField(typeHandler = ProjectTaskChangeLogContentTypeHandler.class)
    private List<ProjectTaskChangeContentItem> content;
}
