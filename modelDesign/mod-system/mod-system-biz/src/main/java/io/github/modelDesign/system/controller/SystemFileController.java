package io.github.modelDesign.system.controller;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.system.request.FileDeleteRequest;
import io.github.modelDesign.system.request.FileUploadRequestDoc;
import io.github.modelDesign.system.request.FileListRequest;
import io.github.modelDesign.system.response.FileDetailVo;
import io.github.modelDesign.system.response.FileListItemVo;
import io.github.modelDesign.system.response.PageResponse;
import io.github.modelDesign.system.service.SystemFileBinaryContent;
import io.github.modelDesign.system.service.SystemFileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

/**
 * 系统文件接口。
 */
@Tag(name = "系统附件")
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/system/file")
public class SystemFileController {
    /**
     * 系统文件服务。
     */
    private final SystemFileService systemFileService;

    /**
     * 上传普通附件。
     *
     * @param file 上传文件
     * @return 文件详情
     */
    @Operation(
            summary = "上传普通附件",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = FileUploadRequestDoc.class)
                    )
            )
    )
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @IgnorePermission
    public FileDetailVo upload(
            @Parameter(hidden = true)
            @RequestPart("file") MultipartFile file) {
        return systemFileService.uploadAttachment(file);
    }

    /**
     * 上传图片。
     *
     * @param file 上传文件
     * @return 文件详情
     */
    @Operation(
            summary = "上传图片",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = FileUploadRequestDoc.class)
                    )
            )
    )
    @PostMapping(value = "/image/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @IgnorePermission
    public FileDetailVo uploadImage(
            @Parameter(hidden = true)
            @RequestPart("file") MultipartFile file) {
        return systemFileService.uploadImage(file);
    }

    /**
     * 获取文件详情。
     *
     * @param id         文件 ID
     * @param aliasFileId 文件别名参数
     * @return 文件详情
     */
    @Operation(summary = "获取文件详情")
    @GetMapping("/get")
    @IgnorePermission
    public FileDetailVo get(
            @Parameter(description = "文件 ID")
            @RequestParam(name = "id", required = false) String id,
            @Parameter(description = "文件 ID，兼容旧参数")
            @RequestParam(name = "file_id", required = false) String aliasFileId) {
        return systemFileService.getDetail(id, aliasFileId);
    }

    /**
     * 获取文件列表。
     *
     * @param request 列表请求
     * @return 分页列表
     */
    @Operation(summary = "获取文件列表")
    @GetMapping("/list")
    @IgnorePermission
    public PageResponse<FileListItemVo> list(@Valid FileListRequest request) {
        return systemFileService.getList(request);
    }

    /**
     * 删除文件。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Operation(summary = "删除文件")
    @PostMapping("/delete")
    public Integer delete(@Valid @RequestBody FileDeleteRequest request) {
        return systemFileService.delete(request);
    }

    /**
     * 获取图片原图内容。
     *
     * @param id 文件 ID
     * @return 图片内容
     */
    @Operation(summary = "获取图片原图")
    @IgnorePermission
    @GetMapping("/image/content/{id}")
    public ResponseEntity<byte[]> imageContent(
            @Parameter(description = "文件 ID", required = true)
            @PathVariable("id") String id) {
        return buildInlineResponse(systemFileService.getImageContent(id));
    }

    /**
     * 获取图片缩略图内容。
     *
     * @param id 文件 ID
     * @return 缩略图内容
     */
    @Operation(summary = "获取图片缩略图")
    @IgnorePermission
    @GetMapping("/image/thumbnail/{id}")
    public ResponseEntity<byte[]> imageThumbnail(
            @Parameter(description = "文件 ID", required = true)
            @PathVariable("id") String id) {
        return buildInlineResponse(systemFileService.getImageThumbnailContent(id));
    }

    /**
     * 下载文件。
     *
     * @param id 文件 ID
     * @return 文件内容
     */
    @Operation(summary = "下载文件")
    @GetMapping("/download/{id}")
    @IgnorePermission
    public ResponseEntity<byte[]> download(
            @Parameter(description = "文件 ID", required = true)
            @PathVariable("id") String id) {
        return buildAttachmentResponse(systemFileService.download(id));
    }

    private ResponseEntity<byte[]> buildInlineResponse(SystemFileBinaryContent binaryContent) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.inline()
                .filename(binaryContent.filename(), StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(resolveMediaType(binaryContent.contentType()))
                .body(binaryContent.bytes());
    }

    private ResponseEntity<byte[]> buildAttachmentResponse(SystemFileBinaryContent binaryContent) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(binaryContent.filename(), StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(resolveMediaType(binaryContent.contentType()))
                .body(binaryContent.bytes());
    }

    private MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
