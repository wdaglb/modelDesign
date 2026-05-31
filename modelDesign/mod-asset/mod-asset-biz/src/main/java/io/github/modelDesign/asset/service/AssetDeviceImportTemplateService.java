package io.github.modelDesign.asset.service;

import com.alibaba.excel.EasyExcel;
import io.github.modelDesign.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 设备库存导入模板下载服务。
 *
 * 模板生成与导入校验分开，避免导入服务继续膨胀；
 * 模板复用 {@link AssetDeviceImportRow} 的表头定义，保证前后端说明、
 * Excel 表头与导入解析一致。
 */
@Service
@Slf4j
public class AssetDeviceImportTemplateService {
    /**
     * Excel 文件内容类型。
     */
    private static final String EXCEL_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    /**
     * 导入模板文件名。
     */
    private static final String TEMPLATE_FILE_NAME = "设备库存导入模板.xlsx";

    /**
     * 下载导入模板。
     *
     * @param response HTTP 响应
     */
    public void downloadTemplate(HttpServletResponse response) {
        try {
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(EXCEL_CONTENT_TYPE);
            response.setHeader(
                    "Content-Disposition",
                    "attachment;filename*=UTF-8''" + encodeFileName()
            );
            EasyExcel.write(response.getOutputStream(), AssetDeviceImportRow.class)
                    .autoCloseStream(false)
                    .sheet("设备库存")
                    .doWrite(List.of(buildExampleRow()));
        } catch (Exception ex) {
            resetResponseSafely(response);
            log.error("下载设备库存导入模板失败", ex);
            throw new BusinessException(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "下载设备库存导入模板失败"
            );
        }
    }

    private AssetDeviceImportRow buildExampleRow() {
        AssetDeviceImportRow row = new AssetDeviceImportRow();
        row.setDeviceName("示例设备");
        row.setCategoryName("电脑");
        row.setAssetCode("ASSET-20260530-001");
        row.setSerialNumber("SN-EXAMPLE-001");
        row.setLocationName("默认仓库");
        row.setPurchaseDate("2026-05-30");
        row.setRemark("示例行，导入前请删除或替换");
        return row;
    }

    private String encodeFileName() {
        return URLEncoder.encode(TEMPLATE_FILE_NAME, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    private void resetResponseSafely(HttpServletResponse response) {
        try {
            if (!response.isCommitted()) {
                response.reset();
            }
        } catch (Exception ex) {
            log.warn("导入模板下载失败后重置响应失败", ex);
        }
    }
}
