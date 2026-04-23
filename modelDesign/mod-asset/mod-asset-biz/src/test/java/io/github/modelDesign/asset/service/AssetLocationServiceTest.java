package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.request.AssetLocationCreateRequest;
import io.github.modelDesign.asset.response.AssetLocationVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 设备位置服务测试。
 */
class AssetLocationServiceTest {
    /**
     * 新建位置时应落到当前租户并返回位置信息。
     */
    @Test
    void createLocationShouldPersistCurrentTenantNode() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AssetLocationService service = new AssetLocationService(
                authCurrentUserApi,
                assetLocationMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetLocationMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            AssetLocation entity = invocation.getArgument(0);
            entity.setId(7L);
            return 1;
        }).when(assetLocationMapper).insert(any(AssetLocation.class));

        AssetLocationCreateRequest request = new AssetLocationCreateRequest();
        request.setName("A栋-3楼-机房");
        request.setCode("A3F");
        request.setParentId(0L);

        AssetLocationVo result = service.create(request);

        assertEquals(7L, result.getId());
        assertEquals("A栋-3楼-机房", result.getName());
        assertEquals(1001L, result.getTenantId());
    }
}
