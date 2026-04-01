package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 文件上传请求文档模型。
 */
@Data
@Schema(description = "文件上传请求")
public class FileUploadRequestDoc {
    /**
     * 上传文件字段。
     */
    @Schema(description = "上传文件", type = "string", format = "binary")
    private String file;
}
