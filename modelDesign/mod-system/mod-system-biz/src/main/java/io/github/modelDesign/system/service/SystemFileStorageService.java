package io.github.modelDesign.system.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.configuration.SystemFileProperties;
import io.github.modelDesign.system.domain.SystemFile;
import io.github.modelDesign.system.enums.SystemFileTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.dromara.x.file.storage.core.FileInfo;
import org.dromara.x.file.storage.core.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.Objects;

/**
 * 系统文件存储服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemFileStorageService {
    /**
     * 文件存储服务。
     */
    private final FileStorageService fileStorageService;

    /**
     * 系统文件配置。
     */
    private final SystemFileProperties systemFileProperties;

    /**
     * 存储普通附件。
     *
     * @param file 上传文件
     * @return 存储结果
     */
    public StoredFileData storeAttachment(MultipartFile file) {
        FileInfo fileInfo = fileStorageService.of(file)
                .setPath(buildStoragePath(SystemFileTypeEnum.FILE))
                .upload();
        if (fileInfo == null) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "文件上传失败");
        }
        return buildStoredFileData(file, SystemFileTypeEnum.FILE, fileInfo);
    }

    /**
     * 存储图片。
     *
     * @param file 上传文件
     * @return 存储结果
     */
    public StoredFileData storeImage(MultipartFile file) {
        ImageSize imageSize = readImageSize(file);
        String storagePath = buildStoragePath(SystemFileTypeEnum.IMAGE);
        FileInfo fileInfo;
        if (isThumbnailEnabled()) {
            fileInfo = fileStorageService.of(file)
                    .setPath(storagePath)
                    .image(imageSize.width(), imageSize.height())
                    .thumbnail(getThumbnailWidth(), getThumbnailHeight())
                    .upload();
        } else {
            fileInfo = fileStorageService.of(file)
                    .setPath(storagePath)
                    .image(imageSize.width(), imageSize.height())
                    .upload();
        }
        if (fileInfo == null) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "图片上传失败");
        }
        return buildStoredFileData(file, SystemFileTypeEnum.IMAGE, fileInfo);
    }

    /**
     * 下载原文件字节。
     *
     * @param systemFile 文件实体
     * @return 文件字节
     */
    public byte[] download(SystemFile systemFile) {
        try {
            return fileStorageService.download(buildFileInfo(systemFile)).bytes();
        } catch (Exception exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "文件内容不存在");
        }
    }

    /**
     * 下载缩略图字节。
     *
     * @param systemFile 文件实体
     * @return 缩略图字节
     */
    public byte[] downloadThumbnail(SystemFile systemFile) {
        try {
            return fileStorageService.downloadTh(buildFileInfo(systemFile)).bytes();
        } catch (Exception exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "缩略图内容不存在");
        }
    }

    /**
     * 删除上传补偿文件。
     *
     * @param storedFileData 存储结果
     */
    public void deleteUploadResultQuietly(StoredFileData storedFileData) {
        try {
            fileStorageService.delete(buildFileInfo(storedFileData));
        } catch (Exception exception) {
            log.warn("删除补偿文件失败，path={}, filename={}", storedFileData.path(), storedFileData.storageFilename(), exception);
        }
    }

    /**
     * 删除底层文件。
     *
     * @param systemFile 文件实体
     */
    public void deleteStoredFileQuietly(SystemFile systemFile) {
        try {
            fileStorageService.delete(buildFileInfo(systemFile));
        } catch (Exception exception) {
            log.warn("删除底层文件失败，fileId={}", systemFile.getId(), exception);
        }
    }

    private StoredFileData buildStoredFileData(MultipartFile file, SystemFileTypeEnum fileType, FileInfo fileInfo) {
        String storagePlatform = fileInfo.getPlatform();
        if (!StringUtils.hasText(storagePlatform)) {
            storagePlatform = fileStorageService.getDefaultPlatform();
        }
        String basePath = normalizeOptionalText(fileInfo.getBasePath());
        String path = normalizeOptionalText(fileInfo.getPath());
        String storageFilename = normalizeOptionalText(fileInfo.getFilename());
        if (!StringUtils.hasText(storageFilename)) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "文件存储名称为空");
        }
        String thumbnailFilename = normalizeOptionalText(fileInfo.getThFilename());
        String contentType = normalizeContentType(fileInfo.getContentType());
        if (!StringUtils.hasText(fileInfo.getContentType())) {
            contentType = normalizeContentType(file.getContentType());
        }
        Long size = fileInfo.getSize();
        if (size == null || size < 0) {
            size = file.getSize();
        }
        if (size == null || size < 0) {
            size = 0L;
        }
        if (Objects.equals(fileType, SystemFileTypeEnum.FILE)) {
            thumbnailFilename = "";
        }
        return new StoredFileData(storagePlatform, basePath, path, storageFilename, thumbnailFilename, contentType, size);
    }

    private ImageSize readImageSize(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            BufferedImage bufferedImage = ImageIO.read(inputStream);
            if (bufferedImage == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "图片内容无法识别");
            }
            return new ImageSize(bufferedImage.getWidth(), bufferedImage.getHeight());
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "读取图片内容失败");
        }
    }

    private FileInfo buildFileInfo(SystemFile systemFile) {
        FileInfo fileInfo = new FileInfo();
        fileInfo.setPlatform(systemFile.getStoragePlatform());
        fileInfo.setBasePath(systemFile.getBasePath());
        fileInfo.setPath(systemFile.getPath());
        fileInfo.setFilename(systemFile.getStorageFilename());
        if (StringUtils.hasText(systemFile.getThumbnailFilename())) {
            fileInfo.setThFilename(systemFile.getThumbnailFilename());
        }
        return fileInfo;
    }

    private FileInfo buildFileInfo(StoredFileData storedFileData) {
        FileInfo fileInfo = new FileInfo();
        fileInfo.setPlatform(storedFileData.storagePlatform());
        fileInfo.setBasePath(storedFileData.basePath());
        fileInfo.setPath(storedFileData.path());
        fileInfo.setFilename(storedFileData.storageFilename());
        if (StringUtils.hasText(storedFileData.thumbnailFilename())) {
            fileInfo.setThFilename(storedFileData.thumbnailFilename());
        }
        return fileInfo;
    }

    private String buildStoragePath(SystemFileTypeEnum fileType) {
        LocalDate now = LocalDate.now();
        String prefix = "file";
        if (Objects.equals(fileType, SystemFileTypeEnum.IMAGE)) {
            prefix = "image";
        }
        return prefix + "/" + now.getYear() + "/" + now.getMonthValue() + "/" + now.getDayOfMonth() + "/";
    }

    private boolean isThumbnailEnabled() {
        Boolean enabled = systemFileProperties.getThumbnail().getEnabled();
        return Boolean.TRUE.equals(enabled);
    }

    private Integer getThumbnailWidth() {
        return systemFileProperties.getThumbnail().getWidth();
    }

    private Integer getThumbnailHeight() {
        return systemFileProperties.getThumbnail().getHeight();
    }

    private String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        return contentType.trim();
    }

    /**
     * 存储结果。
     *
     * @param storagePlatform  存储平台
     * @param basePath         基础路径
     * @param path             相对路径
     * @param storageFilename  存储文件名
     * @param thumbnailFilename 缩略图文件名
     * @param contentType      内容类型
     * @param size             文件大小
     */
    public record StoredFileData(
            String storagePlatform,
            String basePath,
            String path,
            String storageFilename,
            String thumbnailFilename,
            String contentType,
            Long size
    ) {
    }

    /**
     * 图片尺寸。
     *
     * @param width  宽度
     * @param height 高度
     */
    private record ImageSize(int width, int height) {
    }
}
