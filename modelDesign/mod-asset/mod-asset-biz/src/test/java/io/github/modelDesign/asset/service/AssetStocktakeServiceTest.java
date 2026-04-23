package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import io.github.modelDesign.asset.enums.AssetStocktakeStatusEnum;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeItemMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeTaskMapper;
import io.github.modelDesign.asset.request.AssetStocktakeCheckRequest;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 盘点任务服务测试。
 */
class AssetStocktakeServiceTest {
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
}
