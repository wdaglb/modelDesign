package io.github.modelDesign.project.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 项目成员变更请求。
 */
@Data
public class ProjectMemberUpdateRequest {
    /**
     * 项目 ID。
     */
    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    /**
     * 用户 ID 列表。
     */
    @NotEmpty(message = "用户 ID 不能为空")
    private List<@NotNull(message = "用户 ID 不能为空") Long> userIds;
}
