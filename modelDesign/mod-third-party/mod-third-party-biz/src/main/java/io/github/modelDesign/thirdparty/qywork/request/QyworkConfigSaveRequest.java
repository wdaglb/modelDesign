package io.github.modelDesign.thirdparty.qywork.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存企业微信配置请求。
 */
@Data
@Schema(description = "保存企业微信配置请求")
public class QyworkConfigSaveRequest {
    /**
     * 企业微信 corpId。
     */
    @Schema(description = "企业微信 corpId", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "corpId 不能为空")
    @Size(max = 128, message = "corpId 长度不能超过 128 个字符")
    private String corpId;

    /**
     * 企业微信 corpSecret。
     */
    @Schema(description = "企业微信 corpSecret", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "corpSecret 不能为空")
    @Size(max = 255, message = "corpSecret 长度不能超过 255 个字符")
    private String corpSecret;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
