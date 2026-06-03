package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 项目 GitLab 仓库绑定。
 */
@Data
@TableName("projectGitlabRepository")
@EqualsAndHashCode(callSuper = true)
public class ProjectGitlabRepository extends BaseEntity {
    /**
     * 所属租户 ID。
     */
    private Long tenantId;

    /**
     * 本地项目 ID。
     */
    private Long projectId;

    /**
     * GitLab 项目 ID。
     */
    private Long gitlabProjectId;

    /**
     * GitLab 项目名称快照。
     */
    private String name;

    /**
     * GitLab 完整命名空间路径快照。
     */
    private String pathWithNamespace;

    /**
     * GitLab 项目网页地址快照。
     */
    private String webUrl;
}
