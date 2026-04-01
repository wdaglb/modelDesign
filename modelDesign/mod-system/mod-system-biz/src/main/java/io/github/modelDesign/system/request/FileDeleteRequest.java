package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 文件删除请求。
 */
@Data
@Schema(description = "文件删除请求")
public class FileDeleteRequest {
    /**
     * 文件 ID 列表。
     */
    @Schema(description = "文件 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "文件 ID 不能为空")
    private List<@NotBlank(message = "文件 ID 不能为空") String> ids;
}
