package io.github.modelDesign.project.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑项目请求。
 */
@Data
public class ProjectEditRequest {
    /**
     * 项目名称。
     */
    @NotBlank(message = "项目名称不能为空")
    @Size(max = 128, message = "项目名称长度不能超过 128 个字符")
    private String name;

    /**
     * 项目描述。
     */
    @Size(max = 1000, message = "项目描述长度不能超过 1000 个字符")
    private String description;

    /**
     * 数据库类型。
     */
    @NotBlank(message = "数据库类型不能为空")
    @Size(max = 32, message = "数据库类型长度不能超过 32 个字符")
    private String dbType;
}
