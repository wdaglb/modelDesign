package io.github.modelDesign.asset.service;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Data;

/**
 * 设备批量入库 Excel 行。
 *
 * EasyExcel 通过表头名称绑定字段，模板中的表头必须保持和这里一致；
 * 分类和位置使用名称而不是 ID，降低业务人员导入门槛。
 */
@Data
public class AssetDeviceImportRow {
    /**
     * 设备名称。
     */
    @ColumnWidth(22)
    @ExcelProperty("设备名称")
    private String deviceName;

    /**
     * 设备分类名称。
     */
    @ColumnWidth(16)
    @ExcelProperty("设备分类")
    private String categoryName;

    /**
     * 资产编号。
     */
    @ColumnWidth(24)
    @ExcelProperty("资产编号")
    private String assetCode;

    /**
     * 序列号。
     */
    @ColumnWidth(24)
    @ExcelProperty("序列号")
    private String serialNumber;

    /**
     * 所在位置名称。
     */
    @ColumnWidth(20)
    @ExcelProperty("所在位置")
    private String locationName;

    /**
     * 购置日期，格式为 yyyy-MM-dd。
     */
    @ColumnWidth(16)
    @ExcelProperty("购置日期")
    private String purchaseDate;

    /**
     * 备注。
     */
    @ColumnWidth(32)
    @ExcelProperty("备注")
    private String remark;
}
