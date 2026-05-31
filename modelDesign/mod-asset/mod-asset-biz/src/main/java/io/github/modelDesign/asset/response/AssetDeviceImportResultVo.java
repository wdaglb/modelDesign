package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 设备批量入库结果。
 */
@Data
@Builder
@Schema(description = "设备批量入库结果")
public class AssetDeviceImportResultVo {
    /**
     * 成功导入数量。
     */
    @Schema(description = "成功导入数量")
    private Integer importedCount;
}
