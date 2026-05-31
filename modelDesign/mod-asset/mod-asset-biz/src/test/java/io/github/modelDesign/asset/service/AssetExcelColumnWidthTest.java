package io.github.modelDesign.asset.service;

import com.alibaba.excel.annotation.write.style.ColumnWidth;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 资产 Excel 列宽配置测试。
 */
class AssetExcelColumnWidthTest {
    /**
     * 设备导入模板列宽应匹配常见资产编号和备注长度，
     * 避免模板下载后还要手动拉宽。
     *
     * @throws NoSuchFieldException 字段名维护错误时抛出
     */
    @Test
    void importTemplateShouldUseReadableColumnWidths() throws NoSuchFieldException {
        assertEquals(22, readWidth(AssetDeviceImportRow.class, "deviceName"));
        assertEquals(16, readWidth(AssetDeviceImportRow.class, "categoryName"));
        assertEquals(24, readWidth(AssetDeviceImportRow.class, "assetCode"));
        assertEquals(24, readWidth(AssetDeviceImportRow.class, "serialNumber"));
        assertEquals(20, readWidth(AssetDeviceImportRow.class, "locationName"));
        assertEquals(16, readWidth(AssetDeviceImportRow.class, "purchaseDate"));
        assertEquals(32, readWidth(AssetDeviceImportRow.class, "remark"));
    }

    /**
     * 盘点导出列宽应优先保证设备标识、位置和备注可读。
     *
     * @throws NoSuchFieldException 字段名维护错误时抛出
     */
    @Test
    void stocktakeExportShouldUseReadableColumnWidths() throws NoSuchFieldException {
        assertEquals(22, readWidth(AssetStocktakeExportRow.class, "taskName"));
        assertEquals(24, readWidth(AssetStocktakeExportRow.class, "assetCode"));
        assertEquals(22, readWidth(AssetStocktakeExportRow.class, "deviceName"));
        assertEquals(14, readWidth(AssetStocktakeExportRow.class, "resultLabel"));
        assertEquals(20, readWidth(AssetStocktakeExportRow.class, "expectedLocationName"));
        assertEquals(20, readWidth(AssetStocktakeExportRow.class, "actualLocationName"));
        assertEquals(32, readWidth(AssetStocktakeExportRow.class, "remark"));
    }

    private int readWidth(Class<?> rowClass, String fieldName) throws NoSuchFieldException {
        return rowClass.getDeclaredField(fieldName)
                .getAnnotation(ColumnWidth.class)
                .value();
    }
}
