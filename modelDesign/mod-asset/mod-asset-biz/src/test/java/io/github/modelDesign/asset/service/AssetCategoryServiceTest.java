package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.request.AssetCategoryCreateRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteCheckRequest;
import io.github.modelDesign.asset.request.AssetCategoryDeleteRequest;
import io.github.modelDesign.asset.response.AssetCategoryDeleteCheckVo;
import io.github.modelDesign.asset.response.AssetCategoryVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 设备分类服务测试。
 */
class AssetCategoryServiceTest {
    /**
     * 新建设备分类时应写入当前租户并返回分类信息。
     */
    @Test
    void createCategoryShouldPersistCurrentTenantNode() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryService service = new AssetCategoryService(
                authCurrentUserApi,
                assetCategoryMapper,
                assetDeviceMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetCategoryMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            AssetCategory entity = invocation.getArgument(0);
            entity.setId(9L);
            return 1;
        }).when(assetCategoryMapper).insert(any(AssetCategory.class));

        AssetCategoryCreateRequest request = new AssetCategoryCreateRequest();
        request.setName(" 办公设备 ");
        request.setSort(10);
        request.setRemark(" 常用设备 ");

        AssetCategoryVo result = service.create(request);

        assertEquals(9L, result.getId());
        assertEquals("办公设备", result.getName());
        assertEquals(1001L, result.getTenantId());
        assertEquals(10, result.getSort());
        assertEquals("常用设备", result.getRemark());
    }

    /**
     * 删除前检查时，无设备引用的分类不应要求迁移。
     */
    @Test
    void checkDeleteShouldReturnNoTransferWhenCategoryNotReferenced() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryService service = new AssetCategoryService(
                authCurrentUserApi,
                assetCategoryMapper,
                assetDeviceMapper
        );
        AssetCategory category = buildCategory(9L, 1001L, "办公设备");
        AssetCategory targetCategory = buildCategory(10L, 1001L, "网络设备");
        AssetCategoryDeleteCheckRequest request = new AssetCategoryDeleteCheckRequest();
        request.setIds(List.of(9L));

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetCategoryMapper.selectList(any()))
                .thenReturn(List.of(category))
                .thenReturn(List.of(targetCategory));
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of());

        AssetCategoryDeleteCheckVo result = service.checkDelete(request);

        assertFalse(result.getNeedTransfer());
        assertEquals(0L, result.getTotalReferenceCount());
        assertEquals(1, result.getTransferOptions().size());
        assertEquals(10L, result.getTransferOptions().get(0).getValue());
    }

    /**
     * 存在设备引用但未提供迁移目标时，应拒绝删除。
     */
    @Test
    void deleteCategoriesShouldRejectWhenTransferCategoryMissing() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryService service = new AssetCategoryService(
                authCurrentUserApi,
                assetCategoryMapper,
                assetDeviceMapper
        );
        AssetCategory category = buildCategory(9L, 1001L, "办公设备");
        AssetDevice referencedDevice = new AssetDevice();
        referencedDevice.setCategoryId(9L);
        AssetCategoryDeleteRequest request = new AssetCategoryDeleteRequest();
        request.setIds(List.of(9L));

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetCategoryMapper.selectList(any())).thenReturn(List.of(category));
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of(referencedDevice));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.deleteCategories(request)
        );

        assertEquals("存在设备引用时必须选择迁移目标分类", exception.getMessage());
    }

    /**
     * 删除前检查时，存在设备引用的分类应要求迁移。
     */
    @Test
    void checkDeleteShouldRequireTransferWhenCategoryReferenced() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
        AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
        AssetCategoryService service = new AssetCategoryService(
                authCurrentUserApi,
                assetCategoryMapper,
                assetDeviceMapper
        );
        AssetCategory category = buildCategory(9L, 1001L, "办公设备");
        AssetCategory targetCategory = buildCategory(10L, 1001L, "网络设备");
        AssetDevice referencedDevice = new AssetDevice();
        referencedDevice.setCategoryId(9L);
        AssetCategoryDeleteCheckRequest request = new AssetCategoryDeleteCheckRequest();
        request.setIds(List.of(9L));

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(assetCategoryMapper.selectList(any()))
                .thenReturn(List.of(category))
                .thenReturn(List.of(targetCategory));
        when(assetDeviceMapper.selectList(any())).thenReturn(List.of(referencedDevice));

        AssetCategoryDeleteCheckVo result = service.checkDelete(request);

        assertTrue(result.getNeedTransfer());
        assertEquals(1L, result.getTotalReferenceCount());
        assertEquals(1L, result.getItems().get(0).getReferenceCount());
    }

    private AssetCategory buildCategory(Long id, Long tenantId, String name) {
        AssetCategory category = new AssetCategory();
        category.setId(id);
        category.setTenantId(tenantId);
        category.setName(name);
        category.setSort(1);
        category.setStatus(1);
        category.setRemark("");
        return category;
    }
}
