package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存文件访问配置请求。
 */
@Data
@Schema(description = "保存文件访问配置请求")
public class SystemFileAccessConfigSaveRequest {
    /**
     * 文件访问域名。
     */
    @Schema(description = "文件访问域名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "accessDomain 不能为空")
    @Size(max = 255, message = "accessDomain 长度不能超过 255 个字符")
    private String accessDomain;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
