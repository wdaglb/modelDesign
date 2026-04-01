package io.github.modelDesign.system.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 文件列表请求。
 */
@Data
@Schema(description = "文件列表请求")
public class FileListRequest {
    /**
     * 当前页码。
     */
    @Schema(description = "当前页码")
    @Min(value = 1, message = "当前页码必须大于 0")
    private Integer current = 1;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数必须大于 0")
    private Integer pageSize = 10;

    /**
     * 关键字。
     */
    @Schema(description = "文件名关键字")
    @Size(max = 255, message = "文件名关键字长度不能超过 255 个字符")
    private String keyword;

    /**
     * 文件类型。
     */
    @Schema(description = "文件类型，可选值：IMAGE、FILE")
    @Size(max = 16, message = "文件类型长度不能超过 16 个字符")
    private String fileType;

    /**
     * 创建人 ID。
     */
    @Schema(description = "创建人 ID")
    @Min(value = 1, message = "创建人 ID 必须大于 0")
    private Long creatorId;
}
