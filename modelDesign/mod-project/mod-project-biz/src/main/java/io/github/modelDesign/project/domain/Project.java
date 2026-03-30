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
     * 创建人 ID。
     */
    private Long creatorId;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
