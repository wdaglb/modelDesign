package io.github.modelDesign.system.service;

import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * 系统文件校验工具。
 */
public final class SystemFileValidationHelper {
    /**
     * 图片扩展名白名单。
     */
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    /**
     * 普通附件扩展名白名单。
     */
    private static final Set<String> FILE_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "zip", "rar", "7z"
    );

    private SystemFileValidationHelper() {
    }

    /**
     * 校验公共上传参数。
     *
     * @param file 上传文件
     */
    public static void validateCommonFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "上传文件不能为空");
        }
    }

    /**
     * 校验普通附件上传。
     *
     * @param originalFilename 原始文件名
     */
    public static void validateAttachmentFile(String originalFilename) {
        String extension = resolveExtension(originalFilename);
        if (IMAGE_EXTENSIONS.contains(extension)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "普通附件上传接口不允许上传图片");
        }
        if (!FILE_EXTENSIONS.contains(extension)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前文件类型不支持上传");
        }
    }

    /**
     * 校验图片上传。
     *
     * @param file             上传文件
     * @param originalFilename 原始文件名
     */
    public static void validateImageFile(MultipartFile file, String originalFilename) {
        String contentType = normalizeOptionalText(file.getContentType());
        if (!StringUtils.hasText(contentType) || !contentType.startsWith("image/")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "图片上传接口仅支持图片类型");
        }
        String extension = resolveExtension(originalFilename);
        if (!IMAGE_EXTENSIONS.contains(extension)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前图片类型不支持上传");
        }
    }

    /**
     * 规范化原始文件名。
     *
     * @param file 上传文件
     * @return 原始文件名
     */
    public static String normalizeOriginalFilename(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件名不能为空");
        }
        return originalFilename.trim();
    }

    /**
     * 解析扩展名。
     *
     * @param originalFilename 原始文件名
     * @return 扩展名
     */
    public static String resolveExtension(String originalFilename) {
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == originalFilename.length() - 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件扩展名不能为空");
        }
        return originalFilename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * 规范化可选文本。
     *
     * @param value 文本值
     * @return 规范化后的文本
     */
    public static String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }
}
