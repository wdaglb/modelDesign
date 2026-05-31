package io.github.modelDesign.asset.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 设备库存导入模板下载服务测试。
 */
class AssetDeviceImportTemplateServiceTest {
    /**
     * 模板下载应写入 Excel 内容和中文文件名响应头。
     */
    @Test
    void downloadTemplateShouldWriteExcelResponse() {
        AssetDeviceImportTemplateService service = new AssetDeviceImportTemplateService();
        MockHttpServletResponse response = new MockHttpServletResponse();
        String encodedFileName =
                "%E8%AE%BE%E5%A4%87%E5%BA%93%E5%AD%98%E5%AF%BC"
                        + "%E5%85%A5%E6%A8%A1%E6%9D%BF.xlsx";

        service.downloadTemplate(response);

        assertTrue(response.getContentAsByteArray().length > 0);
        assertTrue(response.getHeader("Content-Disposition")
                .contains(encodedFileName));
    }
}
