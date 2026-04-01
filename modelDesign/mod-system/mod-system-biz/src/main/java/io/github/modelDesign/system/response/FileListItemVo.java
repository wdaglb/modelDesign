package io.github.modelDesign.system.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 文件列表项响应。
 */
@Data
@Builder
@Schema(description = "文件列表项响应")
public class FileListItemVo {
    /**
     * 文件 ID。
     */
    @Schema(description = "文件 ID")
    private String id;

    /**
     * 原图地址。
     */
    @Schema(description = "原图地址")
    private String url;

    /**
     * 缩略图地址。
     */
    @Schema(description = "缩略图地址")
    private String thumbnailUrl;

    /**
     * 下载地址。
     */
    @Schema(description = "下载地址")
    private String downloadUrl;

    /**
     * 文件名。
     */
    @Schema(description = "文件名")
    private String filename;

    /**
     * 内容类型。
     */
    @Schema(description = "内容类型")
    private String contentType;

    /**
     * 文件大小。
     */
    @Schema(description = "文件大小")
    private Long size;

    /**
     * 文件类型。
     */
    @Schema(description = "文件类型")
    private String fileType;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;

    /**
     * 创建人 ID。
     */
    @Schema(description = "创建人 ID")
    private Long creatorId;

    /**
     * 创建人名称。
     */
    @Schema(description = "创建人名称")
    private String creatorName;
}
