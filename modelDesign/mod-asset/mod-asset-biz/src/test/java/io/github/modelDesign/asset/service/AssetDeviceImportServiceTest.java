package io.github.modelDesign.asset.service;

import com.alibaba.excel.EasyExcel;
import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.response.AssetDeviceImportResultVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 设备批量入库导入服务测试。
 */
class AssetDeviceImportServiceTest {
    /**
     * Excel 行全部校验通过时，应整批写入在库设备并记录入库动作。
     */
    @Test
    void importDevicesShouldInsertAllRowsWhenExcelIsValid() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
        AssetTransactionWriteService transactionWriteService =
                mock(AssetTransactionWriteService.class);
        AssetDeviceImportService service = new AssetDeviceImportService(
                authCurrentUserApi,
                assetDeviceMapper,
                assetCategoryMapper,
                assetLocationMapper,
                transactionWriteService
        );
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of());
        when(assetCategoryMapper.selectList(any())).thenReturn(List.of(buildCategory(3L, "电脑")));
        when(assetLocationMapper.selectList(any())).thenReturn(List.of(buildLocation(5L, "仓库")));
        doAnswer(invocation -> {
            AssetDevice entity = invocation.getArgument(0);
            entity.setId(100L);
            return 1;
        }).when(assetDeviceMapper).insert(any(AssetDevice.class));

        AssetDeviceImportResultVo result = service.importDevices(buildExcelFile(List.of(
                buildRow("ThinkPad X1", "电脑", "NB-1001", "仓库"),
                buildRow("MacBook Pro", "电脑", "NB-1002", "仓库")
        )));

        assertEquals(2, result.getImportedCount());
        verify(assetDeviceMapper, times(2)).insert(any(AssetDevice.class));
        verify(transactionWriteService, times(2))
                .writeInbound(any(AssetDevice.class), any(), any());
    }

    /**
     * 文件内资产编号重复时应整批失败，避免只导入部分库存。
     */
    @Test
    void importDevicesShouldRejectDuplicatedAssetCodeInFile() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        AssetDeviceImportService service = new AssetDeviceImportService(
                authCurrentUserApi,
                mock(AssetDeviceMapper.class),
                mock(AssetCategoryMapper.class),
                mock(AssetLocationMapper.class),
                mock(AssetTransactionWriteService.class)
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.importDevices(buildExcelFile(List.of(
                        buildRow("ThinkPad X1", "电脑", "NB-1001", "仓库"),
                        buildRow("MacBook Pro", "电脑", "NB-1001", "仓库")
                )))
        );

        assertEquals("导入文件内资产编号重复：NB-1001", exception.getMessage());
    }

    /**
     * 分类名称在当前租户下重复时，应拒绝按名称导入，避免设备落到错误分类。
     */
    @Test
    void importDevicesShouldRejectDuplicatedCategoryName() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of());
        when(assetCategoryMapper.selectList(any())).thenReturn(List.of(
                buildCategory(3L, "电脑"),
                buildCategory(4L, "电脑")
        ));
        AssetDeviceImportService service = new AssetDeviceImportService(
                authCurrentUserApi,
                assetDeviceMapper,
                assetCategoryMapper,
                mock(AssetLocationMapper.class),
                mock(AssetTransactionWriteService.class)
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.importDevices(buildExcelFile(List.of(
                        buildRow("ThinkPad X1", "电脑", "NB-1001", "仓库")
                )))
        );

        assertEquals("分类名称不唯一，无法按名称导入：电脑", exception.getMessage());
    }

    private AssetDeviceImportRow buildRow(String deviceName,
                                          String categoryName,
                                          String assetCode,
                                          String locationName) {
        AssetDeviceImportRow row = new AssetDeviceImportRow();
        row.setDeviceName(deviceName);
        row.setCategoryName(categoryName);
        row.setAssetCode(assetCode);
        row.setLocationName(locationName);
        row.setPurchaseDate("2026-05-30");
        return row;
    }

    private MockMultipartFile buildExcelFile(List<AssetDeviceImportRow> rows) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        EasyExcel.write(outputStream, AssetDeviceImportRow.class)
                .sheet("设备库存")
                .doWrite(rows);
        return new MockMultipartFile(
                "file",
                "设备库存.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                outputStream.toByteArray()
        );
    }

    private AssetCategory buildCategory(Long id, String name) {
        AssetCategory category = new AssetCategory();
        category.setId(id);
        category.setTenantId(1001L);
        category.setName(name);
        category.setStatus(1);
        return category;
    }

    private AssetLocation buildLocation(Long id, String name) {
        AssetLocation location = new AssetLocation();
        location.setId(id);
        location.setTenantId(1001L);
        location.setName(name);
        location.setStatus(1);
        return location;
    }
}
