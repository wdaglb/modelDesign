package io.github.modelDesign.system.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统文件简要信息。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemFileSimpleDto {
    /**
     * 文件 ID。
     */
    private String id;

    /**
     * 原图地址。
     */
    private String url;

    /**
     * 缩略图地址。
     */
    private String thumbnailUrl;

    /**
     * 下载地址。
     */
    private String downloadUrl;

    /**
     * 原始文件名。
     */
    private String originalFilename;

    /**
     * 内容类型。
     */
    private String contentType;

    /**
     * 文件大小。
     */
    private Long size;

    /**
     * 文件类型。
     */
    private String fileType;
}
