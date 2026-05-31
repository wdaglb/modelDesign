package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.response.AssetDeviceImportResultVo;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.asset.service.AssetDeviceImportService;
import io.github.modelDesign.asset.service.AssetDeviceImportTemplateService;
import io.github.modelDesign.asset.service.AssetDeviceService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 设备台账控制器测试。
 */
class AssetDeviceControllerTest {
    /**
     * 创建接口应直接委托给服务层。
     */
    @Test
    void createShouldDelegateToService() {
        AssetDeviceService assetDeviceService = mock(AssetDeviceService.class);
        AssetDeviceImportService assetDeviceImportService =
                mock(AssetDeviceImportService.class);
        AssetDeviceImportTemplateService importTemplateService =
                mock(AssetDeviceImportTemplateService.class);
        AssetDeviceController controller = new AssetDeviceController(
                assetDeviceService,
                assetDeviceImportService,
                importTemplateService
        );
        AssetDeviceCreateRequest request = new AssetDeviceCreateRequest();
        AssetDeviceVo expected = AssetDeviceVo.builder()
                .id(11L)
                .deviceName("ThinkPad X1")
                .build();
        when(assetDeviceService.create(request)).thenReturn(expected);

        AssetDeviceVo actual = controller.create(request);

        assertSame(expected, actual);
    }

    /**
     * 批量导入接口应直接委托给导入服务。
     */
    @Test
    void importDevicesShouldDelegateToImportService() {
        AssetDeviceService assetDeviceService = mock(AssetDeviceService.class);
        AssetDeviceImportService assetDeviceImportService =
                mock(AssetDeviceImportService.class);
        AssetDeviceImportTemplateService importTemplateService =
                mock(AssetDeviceImportTemplateService.class);
        AssetDeviceController controller = new AssetDeviceController(
                assetDeviceService,
                assetDeviceImportService,
                importTemplateService
        );
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "设备库存.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1}
        );
        AssetDeviceImportResultVo expected = AssetDeviceImportResultVo.builder()
                .importedCount(2)
                .build();
        when(assetDeviceImportService.importDevices(file)).thenReturn(expected);

        AssetDeviceImportResultVo actual = controller.importDevices(file);

        assertSame(expected, actual);
    }

    /**
     * 模板下载接口应直接委托给模板服务。
     */
    @Test
    void downloadImportTemplateShouldDelegateToTemplateService() {
        AssetDeviceService assetDeviceService = mock(AssetDeviceService.class);
        AssetDeviceImportService assetDeviceImportService =
                mock(AssetDeviceImportService.class);
        AssetDeviceImportTemplateService importTemplateService =
                mock(AssetDeviceImportTemplateService.class);
        AssetDeviceController controller = new AssetDeviceController(
                assetDeviceService,
                assetDeviceImportService,
                importTemplateService
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        controller.downloadImportTemplate(response);

        verify(importTemplateService).downloadTemplate(response);
    }
}
