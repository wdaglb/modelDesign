package io.github.modelDesign.system.domain;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统文件。
 */
@Data
@TableName("systemFile")
public class SystemFile {
    /**
     * 文件 ID。
     */
    @TableId(type = IdType.INPUT)
    private String id;

    /**
     * 原始文件名。
     */
    private String originalFilename;

    /**
     * 存储平台。
     */
    private String storagePlatform;

    /**
     * 基础路径。
     */
    private String basePath;

    /**
     * 相对路径。
     */
    private String path;

    /**
     * 存储文件名。
     */
    private String storageFilename;

    /**
     * 缩略图文件名。
     */
    private String thumbnailFilename;

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

    /**
     * 创建人 ID。
     */
    private Long creatorId;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
