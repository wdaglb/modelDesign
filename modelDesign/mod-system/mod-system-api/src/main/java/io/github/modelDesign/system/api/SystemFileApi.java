package io.github.modelDesign.system.api;

import io.github.modelDesign.system.api.dto.SystemFileSimpleDto;

import java.util.Collection;
import java.util.Map;

/**
 * 系统文件查询接口。
 */
public interface SystemFileApi {
    /**
     * 按文件 ID 获取文件信息。
     *
     * @param fileId 文件 ID
     * @return 文件信息，不存在时返回 {@code null}
     */
    SystemFileSimpleDto getById(String fileId);

    /**
     * 按文件 ID 集合获取文件映射。
     *
     * @param fileIds 文件 ID 集合
     * @return 文件映射
     */
    Map<String, SystemFileSimpleDto> getMapByIds(Collection<String> fileIds);
}
