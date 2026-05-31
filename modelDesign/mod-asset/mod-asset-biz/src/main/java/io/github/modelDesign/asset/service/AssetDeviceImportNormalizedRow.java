package io.github.modelDesign.asset.service;

import java.time.LocalDate;

/**
 * 设备批量入库规范化行。
 *
 * 该对象只在导入服务内部包内流转，用来把 Excel 原始文本和后续数据库写入字段解耦。
 */
record AssetDeviceImportNormalizedRow(
        int rowNumber,
        String deviceName,
        String categoryName,
        String assetCode,
        String serialNumber,
        String locationName,
        LocalDate purchaseDate,
        String remark
) {
}
