package io.github.modelDesign.asset.service;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import lombok.Builder;
import lombok.Data;

/**
 * 盘点结果导出行。
 *
 * 导出字段以盘点执行结果复核为目标，
 * 保留设备标识、数量差异和盘点登记信息，
 * 方便业务方在 Excel 中继续筛选、汇总和留档。
 */
@Data
@Builder
public class AssetStocktakeExportRow {
    /**
     * 任务名称。
     */
    @ColumnWidth(22)
    @ExcelProperty("任务名称")
    private String taskName;

    /**
     * 资产编号。
     */
    @ColumnWidth(24)
    @ExcelProperty("资产编号")
    private String assetCode;

    /**
     * 设备名称。
     */
    @ColumnWidth(22)
    @ExcelProperty("设备名称")
    private String deviceName;

    /**
     * 账面数量。
     */
    @ColumnWidth(12)
    @ExcelProperty("账面数量")
    private Integer expectedQuantity;

    /**
     * 实际数量。
     */
    @ColumnWidth(12)
    @ExcelProperty("实际数量")
    private Integer actualQuantity;

    /**
     * 差异数量。
     */
    @ColumnWidth(12)
    @ExcelProperty("差异数量")
    private Integer differenceQuantity;

    /**
     * 盘点结果。
     */
    @ColumnWidth(14)
    @ExcelProperty("盘点结果")
    private String resultLabel;

    /**
     * 账面位置 ID。
     */
    @ColumnWidth(20)
    @ExcelProperty("账面位置")
    private String expectedLocationName;

    /**
     * 账面使用人名称。
     */
    @ColumnWidth(16)
    @ExcelProperty("账面使用人")
    private String expectedUserName;

    /**
     * 实际位置名称。
     */
    @ColumnWidth(20)
    @ExcelProperty("实际位置")
    private String actualLocationName;

    /**
     * 实际使用人名称。
     */
    @ColumnWidth(16)
    @ExcelProperty("实际使用人")
    private String actualUserName;

    /**
     * 盘点人名称。
     */
    @ColumnWidth(16)
    @ExcelProperty("盘点人")
    private String checkedUserName;

    /**
     * 盘点时间。
     */
    @ColumnWidth(20)
    @ExcelProperty("盘点时间")
    private String checkedAt;

    /**
     * 备注。
     */
    @ColumnWidth(32)
    @ExcelProperty("备注")
    private String remark;
}
