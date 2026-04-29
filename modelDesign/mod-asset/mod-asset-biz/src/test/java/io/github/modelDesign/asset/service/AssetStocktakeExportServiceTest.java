package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeItemMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeTaskMapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import jakarta.servlet.ServletOutputStream;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 盘点结果导出服务测试。
 */
class AssetStocktakeExportServiceTest {
    /**
     * 任务不存在时应直接拒绝导出，避免无意义地进入 EasyExcel 写出链路。
     */
    @Test
    void exportShouldRejectWhenTaskMissing() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        AssetStocktakeExportService service = new AssetStocktakeExportService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetLocationMapper,
                authUserApi
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());

        MockHttpServletResponse response = new MockHttpServletResponse();

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.export(3L, response)
        );

        assertEquals("盘点任务不存在", exception.getMessage());
    }

    /**
     * 导出写流失败时应先重置响应，避免全局异常处理沿用 Excel 内容类型。
     */
    @Test
    void exportShouldResetResponseWhenWriteFails() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetStocktakeTaskMapper assetStocktakeTaskMapper = mock(AssetStocktakeTaskMapper.class);
        AssetStocktakeItemMapper assetStocktakeItemMapper = mock(AssetStocktakeItemMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        AssetStocktakeExportService service = new AssetStocktakeExportService(
                authCurrentUserApi,
                assetStocktakeTaskMapper,
                assetStocktakeItemMapper,
                assetDeviceMapper,
                assetLocationMapper,
                authUserApi
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetStocktakeItemMapper.selectList(any())).thenReturn(Collections.emptyList());

        MockHttpServletResponse response = new MockHttpServletResponse() {
            @Override
            public ServletOutputStream getOutputStream() {
                throw new RuntimeException("mock stream failure");
            }
        };

        AssetStocktakeTask task = new AssetStocktakeTask();
        task.setId(3L);
        task.setTenantId(1001L);
        task.setName("月度盘点");
        when(assetStocktakeTaskMapper.selectById(3L)).thenReturn(task);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.export(3L, response)
        );

        assertEquals("导出盘点结果失败", exception.getMessage());
        assertNull(response.getContentType());
    }
}
