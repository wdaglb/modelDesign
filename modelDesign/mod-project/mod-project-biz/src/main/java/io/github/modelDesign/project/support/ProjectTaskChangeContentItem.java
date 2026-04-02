package io.github.modelDesign.project.support;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 任务变更内容项。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTaskChangeContentItem {
    /**
     * 字段编码。
     */
    private String field;

    /**
     * 字段名称。
     */
    private String label;

    /**
     * 变更前展示值。
     */
    private String beforeValue;

    /**
     * 变更后展示值。
     */
    private String afterValue;
}
