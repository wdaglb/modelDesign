package io.github.modelDesign.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.api.dto.SystemFileSimpleDto;
import io.github.modelDesign.system.domain.SystemFile;
import io.github.modelDesign.system.enums.SystemFileTypeEnum;
import io.github.modelDesign.system.mapper.SystemFileMapper;
import io.github.modelDesign.system.request.FileDeleteRequest;
import io.github.modelDesign.system.request.FileListRequest;
import io.github.modelDesign.system.response.FileDetailVo;
import io.github.modelDesign.system.response.FileListItemVo;
import io.github.modelDesign.system.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 系统文件服务。
 */
@Service
@RequiredArgsConstructor
public class SystemFileService extends ServiceImpl<SystemFileMapper, SystemFile> implements IService<SystemFile> {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 文件存储服务。
     */
    private final SystemFileStorageService systemFileStorageService;

    /**
     * 文件视图组装器。
     */
    private final SystemFileViewAssembler systemFileViewAssembler;

    /**
     * 上传普通附件。
     *
     * @param file 上传文件
     * @return 文件详情
     */
    @Transactional(rollbackFor = Exception.class)
    public FileDetailVo uploadAttachment(MultipartFile file) {
        SystemFileValidationHelper.validateCommonFile(file);
        String originalFilename = SystemFileValidationHelper.normalizeOriginalFilename(file);
        SystemFileValidationHelper.validateAttachmentFile(originalFilename);
        SystemFileStorageService.StoredFileData storedFileData = systemFileStorageService.storeAttachment(file);
        SystemFile systemFile = buildSystemFile(storedFileData, originalFilename, SystemFileTypeEnum.FILE);
        persistUploadedFile(systemFile, storedFileData);
        return systemFileViewAssembler.toDetailVo(systemFile);
    }

    /**
     * 上传图片。
     *
     * @param file 上传文件
     * @return 文件详情
     */
    @Transactional(rollbackFor = Exception.class)
    public FileDetailVo uploadImage(MultipartFile file) {
        SystemFileValidationHelper.validateCommonFile(file);
        String originalFilename = SystemFileValidationHelper.normalizeOriginalFilename(file);
        SystemFileValidationHelper.validateImageFile(file, originalFilename);
        SystemFileStorageService.StoredFileData storedFileData = systemFileStorageService.storeImage(file);
        SystemFile systemFile = buildSystemFile(storedFileData, originalFilename, SystemFileTypeEnum.IMAGE);
        persistUploadedFile(systemFile, storedFileData);
        return systemFileViewAssembler.toDetailVo(systemFile);
    }

    /**
     * 获取文件详情。
     *
     * @param id          文件 ID
     * @param aliasFileId 兼容旧参数的文件 ID
     * @return 文件详情
     */
    public FileDetailVo getDetail(String id, String aliasFileId) {
        String targetFileId = resolveTargetFileId(id, aliasFileId);
        SystemFile systemFile = requireSystemFile(targetFileId);
        return systemFileViewAssembler.toDetailVo(systemFile);
    }

    /**
     * 获取文件列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<FileListItemVo> getList(FileListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String normalizedKeyword = SystemFileValidationHelper.normalizeOptionalText(request.getKeyword());
        String normalizedFileType = SystemFileValidationHelper.normalizeOptionalText(request.getFileType());
        if (StringUtils.hasText(normalizedFileType) && !isSupportedFileType(normalizedFileType)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件类型不支持");
        }
        List<SystemFile> allFiles = lambdaQuery()
                .eq(SystemFile::getDeleted, 0)
                .like(StringUtils.hasText(normalizedKeyword), SystemFile::getOriginalFilename, normalizedKeyword)
                .eq(StringUtils.hasText(normalizedFileType), SystemFile::getFileType, normalizedFileType)
                .eq(request.getCreatorId() != null, SystemFile::getCreatorId, request.getCreatorId())
                .orderByDesc(SystemFile::getUpdateTime)
                .list();
        long total = allFiles.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<SystemFile> pageFiles = allFiles.subList((int) fromIndex, (int) toIndex);
        Map<Long, String> creatorNameMap = getCreatorNameMap(pageFiles);
        return new PageResponse<>(systemFileViewAssembler.toListItemList(pageFiles, creatorNameMap), total);
    }

    /**
     * 删除文件。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Transactional(rollbackFor = Exception.class)
    public Integer delete(FileDeleteRequest request) {
        List<String> targetIds = normalizeFileIds(request.getIds());
        if (targetIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件 ID 不能为空");
        }
        List<SystemFile> systemFiles = lambdaQuery()
                .in(SystemFile::getId, targetIds)
                .eq(SystemFile::getDeleted, 0)
                .list();
        if (systemFiles.isEmpty()) {
            return 0;
        }
        List<String> deletedIds = systemFiles.stream().map(SystemFile::getId).toList();
        lambdaUpdate()
                .in(SystemFile::getId, deletedIds)
                .set(SystemFile::getDeleted, 1)
                .update();
        for (SystemFile systemFile : systemFiles) {
            systemFileStorageService.deleteStoredFileQuietly(systemFile);
        }
        return deletedIds.size();
    }

    /**
     * 获取图片原图内容。
     *
     * @param id 文件 ID
     * @return 图片内容
     */
    public SystemFileBinaryContent getImageContent(String id) {
        SystemFile systemFile = requireImageFile(id);
        byte[] bytes = systemFileStorageService.download(systemFile);
        return new SystemFileBinaryContent(bytes, normalizeContentType(systemFile.getContentType()), systemFile.getOriginalFilename());
    }

    /**
     * 获取图片缩略图内容。
     *
     * @param id 文件 ID
     * @return 缩略图内容
     */
    public SystemFileBinaryContent getImageThumbnailContent(String id) {
        SystemFile systemFile = requireImageFile(id);
        if (!StringUtils.hasText(systemFile.getThumbnailFilename())) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "缩略图不存在");
        }
        byte[] bytes = systemFileStorageService.downloadThumbnail(systemFile);
        return new SystemFileBinaryContent(bytes, MediaType.IMAGE_JPEG_VALUE, systemFile.getOriginalFilename());
    }

    /**
     * 下载文件。
     *
     * @param id 文件 ID
     * @return 文件内容
     */
    public SystemFileBinaryContent download(String id) {
        SystemFile systemFile = requireSystemFile(id);
        byte[] bytes = systemFileStorageService.download(systemFile);
        return new SystemFileBinaryContent(bytes, normalizeContentType(systemFile.getContentType()), systemFile.getOriginalFilename());
    }

    /**
     * 按文件 ID 获取公共 DTO。
     *
     * @param fileId 文件 ID
     * @return 文件 DTO
     */
    public SystemFileSimpleDto getSimpleDtoById(String fileId) {
        if (!StringUtils.hasText(fileId)) {
            return null;
        }
        SystemFile systemFile = lambdaQuery()
                .eq(SystemFile::getId, fileId.trim())
                .eq(SystemFile::getDeleted, 0)
                .last("limit 1")
                .one();
        if (systemFile == null) {
            return null;
        }
        return systemFileViewAssembler.toSimpleDto(systemFile);
    }

    /**
     * 按文件 ID 集合获取公共 DTO 映射。
     *
     * @param fileIds 文件 ID 集合
     * @return 文件 DTO 映射
     */
    public Map<String, SystemFileSimpleDto> getSimpleDtoMapByIds(Collection<String> fileIds) {
        List<String> normalizedIds = normalizeFileIds(fileIds);
        if (normalizedIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return lambdaQuery()
                .in(SystemFile::getId, normalizedIds)
                .eq(SystemFile::getDeleted, 0)
                .list()
                .stream()
                .map(systemFileViewAssembler::toSimpleDto)
                .collect(Collectors.toMap(SystemFileSimpleDto::getId, dto -> dto, (left, right) -> left, LinkedHashMap::new));
    }

    private void persistUploadedFile(SystemFile systemFile, SystemFileStorageService.StoredFileData storedFileData) {
        try {
            boolean saved = save(systemFile);
            if (!saved) {
                systemFileStorageService.deleteUploadResultQuietly(storedFileData);
                throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "保存文件信息失败");
            }
        } catch (RuntimeException exception) {
            if (exception instanceof BusinessException businessException
                    && businessException.getStatus() == HttpStatus.INTERNAL_SERVER_ERROR.value()
                    && "保存文件信息失败".equals(businessException.getMessage())) {
                throw exception;
            }
            systemFileStorageService.deleteUploadResultQuietly(storedFileData);
            throw exception;
        }
    }

    private SystemFile buildSystemFile(SystemFileStorageService.StoredFileData storedFileData, String originalFilename, SystemFileTypeEnum fileType) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        SystemFile systemFile = new SystemFile();
        systemFile.setId(UUID.randomUUID().toString());
        systemFile.setOriginalFilename(originalFilename);
        systemFile.setStoragePlatform(storedFileData.storagePlatform());
        systemFile.setBasePath(storedFileData.basePath());
        systemFile.setPath(storedFileData.path());
        systemFile.setStorageFilename(storedFileData.storageFilename());
        systemFile.setThumbnailFilename(storedFileData.thumbnailFilename());
        systemFile.setContentType(storedFileData.contentType());
        systemFile.setSize(storedFileData.size());
        systemFile.setFileType(fileType.name());
        systemFile.setCreatorId(currentUser.getUserId());
        systemFile.setDeleted(0);
        return systemFile;
    }

    private String resolveTargetFileId(String id, String aliasFileId) {
        if (StringUtils.hasText(id)) {
            return id.trim();
        }
        if (StringUtils.hasText(aliasFileId)) {
            return aliasFileId.trim();
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件 ID 不能为空");
    }

    private SystemFile requireSystemFile(String id) {
        if (!StringUtils.hasText(id)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "文件 ID 不能为空");
        }
        SystemFile systemFile = lambdaQuery()
                .eq(SystemFile::getId, id.trim())
                .eq(SystemFile::getDeleted, 0)
                .last("limit 1")
                .one();
        if (systemFile == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "文件不存在");
        }
        return systemFile;
    }

    private SystemFile requireImageFile(String id) {
        SystemFile systemFile = requireSystemFile(id);
        if (!Objects.equals(systemFile.getFileType(), SystemFileTypeEnum.IMAGE.name())) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "图片不存在");
        }
        return systemFile;
    }

    private Map<Long, String> getCreatorNameMap(List<SystemFile> systemFiles) {
        Set<Long> creatorIds = systemFiles.stream()
                .map(SystemFile::getCreatorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (creatorIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(creatorIds)
                .values()
                .stream()
                .collect(Collectors.toMap(AuthUserSimpleDto::getId, user -> SystemFileValidationHelper.normalizeOptionalText(user.getNickname()), (left, right) -> left));
    }

    private List<String> normalizeFileIds(Collection<String> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return Collections.emptyList();
        }
        LinkedHashSet<String> normalizedIds = new LinkedHashSet<>();
        for (String fileId : fileIds) {
            if (!StringUtils.hasText(fileId)) {
                continue;
            }
            normalizedIds.add(fileId.trim());
        }
        return new ArrayList<>(normalizedIds);
    }

    private boolean isSupportedFileType(String fileType) {
        for (SystemFileTypeEnum value : SystemFileTypeEnum.values()) {
            if (value.name().equals(fileType)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        return contentType.trim();
    }

}
