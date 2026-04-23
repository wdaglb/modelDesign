package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.request.AssetDeviceReceiveRequest;
import io.github.modelDesign.asset.request.AssetDeviceReturnRequest;
import io.github.modelDesign.asset.request.AssetDeviceScrapRequest;
import io.github.modelDesign.asset.request.AssetDeviceTransferRequest;
import io.github.modelDesign.asset.request.AssetDeviceListRequest;
import io.github.modelDesign.asset.response.PageResponse;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    /**
     * 在库设备应允许领用，并切换到领用中状态。
     */
    @Test
    void receiveShouldMoveInStockDeviceToInUse() {
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

        AssetDevice existed = buildDevice(11L, 1001L, AssetDeviceStatusEnum.IN_STOCK.getValue());
        existed.setLocationId(3L);
        when(assetDeviceMapper.selectById(11L)).thenReturn(existed);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());

        AssetDeviceReceiveRequest request = new AssetDeviceReceiveRequest();
        request.setId(11L);
        request.setCurrentUserId(66L);
        request.setRemark("研发领用");

        AssetDeviceVo result = service.receive(request);

        assertEquals(AssetDeviceStatusEnum.IN_USE.getValue(), result.getStatus());
        assertEquals(66L, result.getCurrentUserId());
    }

    /**
     * 领用中的设备不允许直接报废。
     */
    @Test
    void scrapShouldRejectInUseDevice() {
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

        AssetDevice existed = buildDevice(11L, 1001L, AssetDeviceStatusEnum.IN_USE.getValue());
        when(assetDeviceMapper.selectById(11L)).thenReturn(existed);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());

        AssetDeviceScrapRequest request = new AssetDeviceScrapRequest();
        request.setId(11L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.scrap(request)
        );
        assertEquals("领用中的设备请先归还后再报废", exception.getMessage());
    }

    private AssetDevice buildDevice(Long id, Long tenantId, Integer status) {
        AssetDevice device = new AssetDevice();
        device.setId(id);
        device.setTenantId(tenantId);
        device.setDeviceName("测试设备");
        device.setCategoryId(3L);
        device.setAssetCode("TEST-" + id);
        device.setStatus(status);
        device.setDeleted(0);
        return device;
    }
}
