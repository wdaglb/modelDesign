package io.github.modelDesign.auth.api;

import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 用户查询接口。
 */
public interface AuthUserApi {
    /**
     * 按用户 ID 集合获取用户映射。
     *
     * @param userIds 用户 ID 集合
     * @return 用户映射
     */
    Map<Long, AuthUserSimpleDto> getUserMapByIds(Collection<Long> userIds);

    /**
     * 按租户获取用户简要列表。
     *
     * @param tenantId 租户 ID
     * @return 用户列表
     */
    List<AuthUserSimpleDto> listUsersByTenantId(Long tenantId);
}
