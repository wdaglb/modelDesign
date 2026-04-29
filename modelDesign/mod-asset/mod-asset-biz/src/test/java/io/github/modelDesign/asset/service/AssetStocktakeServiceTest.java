package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.enums.AssetStocktakeItemResultEnum;
import io.github.modelDesign.asset.enums.AssetStocktakeStatusEnum;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeItemMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeTaskMapper;
import io.github.modelDesign.asset.request.AssetStocktakeCheckRequest;
import io.github.modelDesign.asset.request.AssetStocktakeCreateRequest;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 盘点任务服务测试。
 */
class AssetStocktakeServiceTest {
    /**
     * 创建盘点任务时应固化当前范围内设备，后续任务执行只处理这批明细。
     */
    @Test
    void createShouldSnapshotDevicesIntoTaskItems() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetStocktakeService service = new AssetStocktakeService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetTransactionWriteService
        );

        AssetDevice device = new AssetDevice();
        device.setId(11L);
        device.setTenantId(1001L);
        device.setDeleted(0);
        device.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of(device));
        doAnswer(invocation -> {
            AssetStocktakeTask task = invocation.getArgument(0);
            task.setId(3L);
            return 1;
        }).when(assetStocktakeTaskMapper).insert(any(AssetStocktakeTask.class));

        AssetStocktakeCreateRequest request = new AssetStocktakeCreateRequest();
        request.setName("月度盘点");
        request.setScopeType(1);

        service.create(request);

        verify(assetStocktakeItemMapper).insert(argThat((AssetStocktakeItem item) -> {
            return item.getTenantId().equals(1001L)
                    && item.getTaskId().equals(3L)
                    && item.getDeviceId().equals(11L)
                    && item.getExpectedQuantity().equals(1);
        }));
    }

    /**
     * 已完成盘点任务不允许继续提交盘点结果。
     */
    @Test
    void completeShouldRejectFurtherCheckWhenTaskFinished() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetStocktakeService service = new AssetStocktakeService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetTransactionWriteService
        );

        AssetStocktakeTask task = new AssetStocktakeTask();
        task.setId(3L);
        task.setTenantId(1001L);
        task.setStatus(AssetStocktakeStatusEnum.FINISHED.getValue());
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetStocktakeTaskMapper.selectById(3L)).thenReturn(task);

        AssetStocktakeCheckRequest request = new AssetStocktakeCheckRequest();
        request.setTaskId(3L);
        request.setDeviceId(11L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.check(request)
        );
        assertEquals("盘点任务已完成，不能继续提交", exception.getMessage());
    }

    /**
     * 提交盘点结果时应保存实际数量和差异数量，支撑盘点数量核验。
     */
    @Test
    void checkShouldSaveActualQuantityAndDifferenceQuantity() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetStocktakeService service = new AssetStocktakeService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetTransactionWriteService
        );

        AssetStocktakeTask task = new AssetStocktakeTask();
        task.setId(3L);
        task.setTenantId(1001L);
        task.setStatus(AssetStocktakeStatusEnum.PROCESSING.getValue());
        AssetStocktakeItem item = new AssetStocktakeItem();
        item.setId(9L);
        item.setTenantId(1001L);
        item.setTaskId(3L);
        item.setDeviceId(11L);
        item.setExpectedQuantity(1);
        AssetDevice device = new AssetDevice();
        device.setId(11L);
        device.setTenantId(1001L);
        device.setLocationId(22L);

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetStocktakeTaskMapper.selectById(3L)).thenReturn(task);
        when(assetStocktakeItemMapper.selectOne(any())).thenReturn(item);
        when(assetDeviceMapper.selectById(11L)).thenReturn(device);

        AssetStocktakeCheckRequest request = new AssetStocktakeCheckRequest();
        request.setTaskId(3L);
        request.setDeviceId(11L);
        request.setResultStatus(AssetStocktakeItemResultEnum.FOUND.getValue());
        request.setActualQuantity(3);

        service.check(request);

        verify(assetStocktakeItemMapper).updateById(argThat((AssetStocktakeItem updatedItem) -> {
            return updatedItem.getActualQuantity().equals(3)
                    && updatedItem.getDifferenceQuantity().equals(2)
                    && updatedItem.getActualLocationId().equals(22L);
        }));
    }

    /**
     * 完成盘点任务时，盘亏明细应同步反写设备台账状态。
     */
    @Test
    void completeShouldMarkMissingDevicesAsLost() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetTransactionWriteService assetTransactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetStocktakeService service = new AssetStocktakeService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetTransactionWriteService
        );

        AssetStocktakeTask task = new AssetStocktakeTask();
        task.setId(3L);
        task.setTenantId(1001L);
        task.setStatus(AssetStocktakeStatusEnum.PROCESSING.getValue());
        AssetStocktakeItem item = new AssetStocktakeItem();
        item.setId(9L);
        item.setTenantId(1001L);
        item.setTaskId(3L);
        item.setDeviceId(11L);
        item.setExpectedQuantity(1);
        item.setActualQuantity(0);
        item.setDifferenceQuantity(-1);
        item.setResultStatus(AssetStocktakeItemResultEnum.MISSING.getValue());
        AssetDevice device = new AssetDevice();
        device.setId(11L);
        device.setTenantId(1001L);
        device.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetStocktakeTaskMapper.selectById(3L)).thenReturn(task);
        when(assetStocktakeItemMapper.selectList(any())).thenReturn(List.of(item));
        when(assetDeviceMapper.selectById(11L)).thenReturn(device);

        service.complete(3L);

        verify(assetDeviceMapper).updateById(argThat((AssetDevice updatedDevice) -> {
            return updatedDevice.getId().equals(11L)
                    && updatedDevice.getStatus().equals(AssetDeviceStatusEnum.LOST.getValue())
                    && updatedDevice.getCurrentUserId() == null;
        }));
        verify(assetTransactionWriteService).writeStocktakeLoss(device, 7L, item.getRemark());
    }
}
