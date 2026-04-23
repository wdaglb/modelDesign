package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.request.AssetDeviceListRequest;
import io.github.modelDesign.asset.response.PageResponse;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 设备台账服务测试。
 */
class AssetDeviceServiceTest {
    /**
     * 入库登记后应落当前租户，并默认进入在库状态。
     */
    @Test
    void createShouldPersistDeviceWithInStockStatus() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetDeviceService service = new AssetDeviceService(
                authCurrentUserApi,
                assetDeviceMapper,
                assetCategoryMapper,
                assetLocationMapper,
                assetTransactionWriteService
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetCategoryMapper.selectCount(any())).thenReturn(1L);
        when(assetLocationMapper.selectCount(any())).thenReturn(1L);
        doAnswer(invocation -> {
            AssetDevice entity = invocation.getArgument(0);
            entity.setId(11L);
            return 1;
        }).when(assetDeviceMapper).insert(any(AssetDevice.class));

        AssetDeviceCreateRequest request = new AssetDeviceCreateRequest();
        request.setDeviceName("ThinkPad X1");
        request.setCategoryId(2L);
        request.setAssetCode("NB-1001");
        request.setSerialNumber("SN-1001");
        request.setLocationId(5L);

        AssetDeviceVo result = service.create(request);

        assertEquals(11L, result.getId());
        assertEquals(1001L, result.getTenantId());
        assertEquals(AssetDeviceStatusEnum.IN_STOCK.getValue(), result.getStatus());
    }

    /**
     * 查询列表时应只返回当前租户的分页结果。
     */
    @Test
    void getListShouldReturnTenantScopedPageResult() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetDeviceService service = new AssetDeviceService(
                authCurrentUserApi,
                assetDeviceMapper,
                assetCategoryMapper,
                assetLocationMapper,
                assetTransactionWriteService
        );

        AssetDevice entity = new AssetDevice();
        entity.setId(21L);
        entity.setTenantId(1001L);
        entity.setDeviceName("MacBook Pro");
        entity.setCategoryId(3L);
        entity.setAssetCode("NB-2001");
        entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of(entity));

        AssetDeviceListRequest request = new AssetDeviceListRequest();
        request.setCurrent(1);
        request.setPageSize(10);

        PageResponse<AssetDeviceVo> result = service.getList(request);

        assertEquals(1L, result.getTotal());
        assertEquals(1, result.getItems().size());
        assertEquals("MacBook Pro", result.getItems().get(0).getDeviceName());
    }
}
