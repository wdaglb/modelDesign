package io.github.modelDesign.system.api;

import io.github.modelDesign.system.api.dto.SystemFileSimpleDto;
import io.github.modelDesign.system.service.SystemFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;

/**
 * 系统文件查询接口实现。
 */
@Service
@RequiredArgsConstructor
public class SystemFileApiImpl implements SystemFileApi {
    /**
     * 系统文件服务。
     */
    private final SystemFileService systemFileService;

    /**
     * 按文件 ID 获取文件信息。
     *
     * @param fileId 文件 ID
     * @return 文件信息
     */
    @Override
    public SystemFileSimpleDto getById(String fileId) {
        return systemFileService.getSimpleDtoById(fileId);
    }

    /**
     * 按文件 ID 集合获取文件映射。
     *
     * @param fileIds 文件 ID 集合
     * @return 文件映射
     */
    @Override
    public Map<String, SystemFileSimpleDto> getMapByIds(Collection<String> fileIds) {
        return systemFileService.getSimpleDtoMapByIds(fileIds);
    }
}
