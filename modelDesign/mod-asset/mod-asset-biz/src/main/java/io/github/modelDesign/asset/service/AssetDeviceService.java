package io.github.modelDesign.asset.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.request.AssetDeviceCreateRequest;
import io.github.modelDesign.asset.request.AssetDeviceEditRequest;
import io.github.modelDesign.asset.request.AssetDeviceListRequest;
import io.github.modelDesign.asset.request.AssetDeviceReceiveRequest;
import io.github.modelDesign.asset.request.AssetDeviceReturnRequest;
import io.github.modelDesign.asset.request.AssetDeviceScrapRequest;
import io.github.modelDesign.asset.request.AssetDeviceTransferRequest;
import io.github.modelDesign.asset.response.AssetDeviceVo;
import io.github.modelDesign.asset.response.PageResponse;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * 设备台账服务。
 */
@Service
@RequiredArgsConstructor
public class AssetDeviceService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 设备台账 Mapper。
     */
    private final AssetDeviceMapper assetDeviceMapper;

    /**
     * 分类 Mapper。
     */
    private final AssetCategoryMapper assetCategoryMapper;

    /**
     * 位置 Mapper。
     */
    private final AssetLocationMapper assetLocationMapper;

    /**
     * 流水写入服务。
     */
    private final AssetTransactionWriteService assetTransactionWriteService;

    /**
     * 分页查询设备台账。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<AssetDeviceVo> getList(AssetDeviceListRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        String deviceName = normalizeOptionalText(request.getDeviceName(), 100);
        String assetCode = normalizeOptionalText(request.getAssetCode(), 64);
        String serialNumber = normalizeOptionalText(request.getSerialNumber(), 128);
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<AssetDevice> allDevices = assetDeviceMapper.selectList(new LambdaQueryWrapper<AssetDevice>()
                .eq(AssetDevice::getTenantId, currentUser.getTenantId())
                .eq(AssetDevice::getDeleted, 0)
                .like(StringUtils.hasText(deviceName), AssetDevice::getDeviceName, deviceName)
                .eq(request.getCategoryId() != null, AssetDevice::getCategoryId, request.getCategoryId())
                .like(StringUtils.hasText(assetCode), AssetDevice::getAssetCode, assetCode)
                .like(StringUtils.hasText(serialNumber), AssetDevice::getSerialNumber, serialNumber)
                .eq(request.getStatus() != null, AssetDevice::getStatus, request.getStatus())
                .eq(request.getLocationId() != null, AssetDevice::getLocationId, request.getLocationId())
                .eq(request.getCurrentUserId() != null, AssetDevice::getCurrentUserId, request.getCurrentUserId())
                .orderByDesc(AssetDevice::getUpdateTime));
        long total = allDevices.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<AssetDeviceVo> items = allDevices.subList((int) fromIndex, (int) toIndex)
                .stream()
                .map(this::toDeviceVo)
                .toList();
        return new PageResponse<>(items, total);
    }

    /**
     * 入库登记。
     *
     * @param request 入库请求
     * @return 台账详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo create(AssetDeviceCreateRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        validateCategory(request.getCategoryId(), currentUser.getTenantId());
        validateLocation(request.getLocationId(), currentUser.getTenantId());

        AssetDevice entity = new AssetDevice();
        entity.setTenantId(currentUser.getTenantId());
        entity.setDeviceName(normalizeRequiredText(request.getDeviceName(), "设备名称不能为空", 100));
        entity.setCategoryId(request.getCategoryId());
        entity.setAssetCode(normalizeRequiredText(request.getAssetCode(), "资产编号不能为空", 64));
        entity.setSerialNumber(normalizeOptionalText(request.getSerialNumber(), 128));
        entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        entity.setLocationId(request.getLocationId());
        entity.setPurchaseDate(request.getPurchaseDate());
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        entity.setDeleted(0);
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.insert(entity);
        assetTransactionWriteService.writeInbound(entity, currentUser.getUserId(), entity.getRemark());
        return toDeviceVo(entity);
    }

    /**
     * 编辑设备台账。
     *
     * @param id      设备 ID
     * @param request 编辑请求
     * @return 更新后的台账
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo edit(Long id, AssetDeviceEditRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetDevice entity = requireDevice(id, currentUser.getTenantId());
        validateCategory(request.getCategoryId(), currentUser.getTenantId());
        validateLocation(request.getLocationId(), currentUser.getTenantId());
        entity.setDeviceName(normalizeRequiredText(request.getDeviceName(), "设备名称不能为空", 100));
        entity.setCategoryId(request.getCategoryId());
        entity.setAssetCode(normalizeRequiredText(request.getAssetCode(), "资产编号不能为空", 64));
        entity.setSerialNumber(normalizeOptionalText(request.getSerialNumber(), 128));
        entity.setLocationId(request.getLocationId());
        entity.setPurchaseDate(request.getPurchaseDate());
        entity.setRemark(normalizeOptionalText(request.getRemark(), 500));
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.updateById(entity);
        return toDeviceVo(entity);
    }

    /**
     * 领用设备。
     *
     * @param request 领用请求
     * @return 更新后的台账
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo receive(AssetDeviceReceiveRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
        requireStatus(entity, AssetDeviceStatusEnum.IN_STOCK, "仅在库设备允许领用");
        entity.setStatus(AssetDeviceStatusEnum.IN_USE.getValue());
        entity.setCurrentUserId(request.getCurrentUserId());
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.updateById(entity);
        assetTransactionWriteService.writeReceive(entity, currentUser.getUserId(), request.getRemark());
        return toDeviceVo(entity);
    }

    /**
     * 归还设备。
     *
     * @param request 归还请求
     * @return 更新后的台账
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo returned(AssetDeviceReturnRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
        requireStatus(entity, AssetDeviceStatusEnum.IN_USE, "仅领用中的设备允许归还");
        validateLocation(request.getLocationId(), currentUser.getTenantId());
        entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        entity.setCurrentUserId(null);
        entity.setLocationId(request.getLocationId());
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.updateById(entity);
        assetTransactionWriteService.writeReturn(entity, currentUser.getUserId(), request.getRemark());
        return toDeviceVo(entity);
    }

    /**
     * 调拨设备。
     *
     * @param request 调拨请求
     * @return 更新后的台账
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo transfer(AssetDeviceTransferRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
        if (Objects.equals(entity.getStatus(), AssetDeviceStatusEnum.SCRAPPED.getValue())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "已报废设备不能调拨");
        }
        validateLocation(request.getLocationId(), currentUser.getTenantId());
        entity.setLocationId(request.getLocationId());
        if (request.getCurrentUserId() != null) {
            entity.setCurrentUserId(request.getCurrentUserId());
        }
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.updateById(entity);
        assetTransactionWriteService.writeTransfer(entity, currentUser.getUserId(), request.getRemark());
        return toDeviceVo(entity);
    }

    /**
     * 报废设备。
     *
     * @param request 报废请求
     * @return 更新后的台账
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo scrap(AssetDeviceScrapRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
        if (Objects.equals(entity.getStatus(), AssetDeviceStatusEnum.IN_USE.getValue())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "领用中的设备请先归还后再报废");
        }
        if (Objects.equals(entity.getStatus(), AssetDeviceStatusEnum.SCRAPPED.getValue())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "设备已报废，请勿重复操作");
        }
        entity.setStatus(AssetDeviceStatusEnum.SCRAPPED.getValue());
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.updateById(entity);
        assetTransactionWriteService.writeScrap(entity, currentUser.getUserId(), request.getRemark());
        return toDeviceVo(entity);
    }

    private void validateCategory(Long categoryId, Long tenantId) {
        Long count = assetCategoryMapper.selectCount(new LambdaQueryWrapper<AssetCategory>()
                .eq(AssetCategory::getTenantId, tenantId)
                .eq(AssetCategory::getId, categoryId)
                .last("limit 1"));
        if (count == null || count <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "设备分类不存在");
        }
    }

    private void validateLocation(Long locationId, Long tenantId) {
        Long count = assetLocationMapper.selectCount(new LambdaQueryWrapper<AssetLocation>()
                .eq(AssetLocation::getTenantId, tenantId)
                .eq(AssetLocation::getId, locationId)
                .last("limit 1"));
        if (count == null || count <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存放位置不存在");
        }
    }

    private AuthCurrentUserDto requireCurrentUser() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser;
    }

    private AssetDevice requireDevice(Long id, Long tenantId) {
        AssetDevice entity = assetDeviceMapper.selectById(id);
        if (entity == null || !Objects.equals(entity.getTenantId(), tenantId)
                || Objects.equals(entity.getDeleted(), 1)) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "设备不存在");
        }
        return entity;
    }

    private void requireStatus(AssetDevice entity,
                               AssetDeviceStatusEnum expectedStatus,
                               String message) {
        if (!Objects.equals(entity.getStatus(), expectedStatus.getValue())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), message);
        }
    }

    private String normalizeRequiredText(String value, String blankMessage, int maxLength) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), blankMessage);
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "字段长度超出限制");
        }
        return normalizedValue;
    }

    private String normalizeOptionalText(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "字段长度超出限制");
        }
        return normalizedValue;
    }

    private AssetDeviceVo toDeviceVo(AssetDevice entity) {
        return AssetDeviceVo.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .deviceName(entity.getDeviceName())
                .categoryId(entity.getCategoryId())
                .assetCode(entity.getAssetCode())
                .serialNumber(entity.getSerialNumber())
                .status(entity.getStatus())
                .locationId(entity.getLocationId())
                .currentUserId(entity.getCurrentUserId())
                .purchaseDate(entity.getPurchaseDate())
                .remark(entity.getRemark())
                .build();
    }
}
