package io.github.modelDesign.asset.controller;

import io.github.modelDesign.asset.request.AssetCategoryCreateRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteCheckRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteRequest;
import io.github.modelDesign.asset.response.AssetCategoryDeleteCheckVo;
import io.github.modelDesign.asset.response.AssetCategoryVo;
import io.github.modelDesign.asset.service.AssetCategoryService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 设备分类控制器测试。
 */
class AssetCategoryControllerTest {
    /**
     * 创建接口应直接委托给服务层。
     */
    @Test
    void createShouldDelegateToService() {
        AssetCategoryService assetCategoryService = mock(AssetCategoryService.class);
        AssetCategoryController controller = new AssetCategoryController(assetCategoryService);
        AssetCategoryCreateRequest request = new AssetCategoryCreateRequest();
        AssetCategoryVo expected = AssetCategoryVo.builder()
                .id(9L)
                .name("办公设备")
                .build();
        when(assetCategoryService.create(request)).thenReturn(expected);

        AssetCategoryVo actual = controller.create(request);

        assertSame(expected, actual);
    }

    /**
     * 删除前检查接口应直接委托给服务层。
     */
    @Test
    void deleteCheckShouldDelegateToService() {
        AssetCategoryService assetCategoryService = mock(AssetCategoryService.class);
        AssetCategoryController controller = new AssetCategoryController(assetCategoryService);
        AssetCategoryDeleteCheckRequest request = new AssetCategoryDeleteCheckRequest();
        request.setIds(List.of(9L));
        AssetCategoryDeleteCheckVo expected = AssetCategoryDeleteCheckVo.builder()
                .needTransfer(false)
                .build();
        when(assetCategoryService.checkDelete(request)).thenReturn(expected);

        AssetCategoryDeleteCheckVo actual = controller.deleteCheck(request);

        assertSame(expected, actual);
    }

    /**
     * 删除接口应直接委托给服务层。
     */
    @Test
    void deleteShouldDelegateToService() {
        AssetCategoryService assetCategoryService = mock(AssetCategoryService.class);
        AssetCategoryController controller = new AssetCategoryController(assetCategoryService);
        AssetCategoryDeleteRequest request = new AssetCategoryDeleteRequest();
        request.setIds(List.of(9L));
        doNothing().when(assetCategoryService).deleteCategories(request);

        controller.delete(request);
    }
}
