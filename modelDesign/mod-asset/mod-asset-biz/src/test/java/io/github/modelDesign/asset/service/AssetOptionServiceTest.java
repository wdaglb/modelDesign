package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.response.AssetOptionVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 资产下拉服务测试。
 */
class AssetOptionServiceTest {
    /**
     * 用户下拉应读取当前租户用户列表。
     */
    @Test
    void getUserOptionsShouldReturnCurrentTenantUsers() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetOptionService service = new AssetOptionService(
                authCurrentUserApi,
                authUserApi,
                assetLocationMapper,
                assetCategoryMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(authUserApi.listUsersByTenantId(1001L)).thenReturn(List.of(
                AuthUserSimpleDto.builder().id(9L).nickname("张三").build()
        ));

        List<AssetOptionVo> result = service.getUserOptions();

        assertEquals(1, result.size());
        assertEquals(9L, result.get(0).getValue());
        assertEquals("张三", result.get(0).getLabel());
    }
}
