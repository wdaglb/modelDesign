package io.github.modelDesign.system.service;

import io.github.modelDesign.system.api.dto.SystemFileSimpleDto;
import io.github.modelDesign.system.domain.SystemFile;
import io.github.modelDesign.system.enums.SystemFileTypeEnum;
import io.github.modelDesign.system.response.FileDetailVo;
import io.github.modelDesign.system.response.FileListItemVo;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 系统文件视图组装器。
 */
@Component
public class SystemFileViewAssembler {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 转换详情响应。
     *
     * @param systemFile 文件实体
     * @return 文件详情
     */
    public FileDetailVo toDetailVo(SystemFile systemFile) {
        return FileDetailVo.builder()
                .id(systemFile.getId())
                .url(buildUrl(systemFile))
                .thumbnailUrl(buildThumbnailUrl(systemFile))
                .downloadUrl(buildDownloadUrl(systemFile.getId()))
                .filename(systemFile.getOriginalFilename())
                .contentType(systemFile.getContentType())
                .size(systemFile.getSize())
                .fileType(systemFile.getFileType())
                .createdAt(formatDateTime(systemFile.getCreateTime()))
                .build();
    }

    /**
     * 转换列表响应。
     *
     * @param systemFiles     文件列表
     * @param creatorNameMap 创建人名称映射
     * @return 列表响应
     */
    public List<FileListItemVo> toListItemList(List<SystemFile> systemFiles, Map<Long, String> creatorNameMap) {
        List<FileListItemVo> result = new ArrayList<>();
        for (SystemFile systemFile : systemFiles) {
            String creatorName = creatorNameMap.get(systemFile.getCreatorId());
            if (!StringUtils.hasText(creatorName)) {
                creatorName = "";
            }
            result.add(FileListItemVo.builder()
                    .id(systemFile.getId())
                    .url(buildUrl(systemFile))
                    .thumbnailUrl(buildThumbnailUrl(systemFile))
                    .downloadUrl(buildDownloadUrl(systemFile.getId()))
                    .filename(systemFile.getOriginalFilename())
                    .contentType(systemFile.getContentType())
                    .size(systemFile.getSize())
                    .fileType(systemFile.getFileType())
                    .createdAt(formatDateTime(systemFile.getCreateTime()))
                    .creatorId(systemFile.getCreatorId())
                    .creatorName(creatorName)
                    .build());
        }
        return result;
    }

    /**
     * 转换公共 DTO。
     *
     * @param systemFile 文件实体
     * @return 文件公共 DTO
     */
    public SystemFileSimpleDto toSimpleDto(SystemFile systemFile) {
        return SystemFileSimpleDto.builder()
                .id(systemFile.getId())
                .url(buildUrl(systemFile))
                .thumbnailUrl(buildThumbnailUrl(systemFile))
                .downloadUrl(buildDownloadUrl(systemFile.getId()))
                .originalFilename(systemFile.getOriginalFilename())
                .contentType(systemFile.getContentType())
                .size(systemFile.getSize())
                .fileType(systemFile.getFileType())
                .build();
    }

    private String buildUrl(SystemFile systemFile) {
        if (!Objects.equals(systemFile.getFileType(), SystemFileTypeEnum.IMAGE.name())) {
            return "";
        }
        return "/system/file/image/content/" + systemFile.getId();
    }

    private String buildThumbnailUrl(SystemFile systemFile) {
        if (!Objects.equals(systemFile.getFileType(), SystemFileTypeEnum.IMAGE.name())) {
            return "";
        }
        if (!StringUtils.hasText(systemFile.getThumbnailFilename())) {
            return "";
        }
        return "/system/file/image/thumbnail/" + systemFile.getId();
    }

    private String buildDownloadUrl(String fileId) {
        return "/system/file/download/" + fileId;
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
