package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.asset.service.AssetDeviceService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
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
        AssetDeviceController controller = new AssetDeviceController(assetDeviceService);
        AssetDeviceCreateRequest request = new AssetDeviceCreateRequest();
        AssetDeviceVo expected = AssetDeviceVo.builder()
                .id(11L)
                .deviceName("ThinkPad X1")
                .build();
        when(assetDeviceService.create(request)).thenReturn(expected);

        AssetDeviceVo actual = controller.create(request);

        assertSame(expected, actual);
    }
}
