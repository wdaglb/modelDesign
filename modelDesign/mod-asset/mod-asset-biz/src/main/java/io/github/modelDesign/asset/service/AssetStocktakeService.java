package io.github.modelDesign.asset.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.enums.AssetStocktakeItemResultEnum;
import io.github.modelDesign.asset.enums.AssetStocktakeScopeTypeEnum;
import io.github.modelDesign.asset.enums.AssetStocktakeStatusEnum;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeItemMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeTaskMapper;
import io.github.modelDesign.asset.request.AssetStocktakeCheckRequest;
import io.github.modelDesign.asset.request.AssetStocktakeCreateRequest;
import io.github.modelDesign.asset.response.AssetStocktakeDetailVo;
import io.github.modelDesign.asset.response.AssetStocktakeTaskVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * 盘点任务服务。
 *
 * 盘点闭环以任务明细为核心：创建任务时固化设备范围，执行阶段逐台登记结果，
 * 完成阶段校验所有明细均已登记，并将盘亏设备同步为台账盘亏状态。
 */
@Service
@RequiredArgsConstructor
public class AssetStocktakeService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 盘点任务 Mapper。
     */
    private final AssetStocktakeTaskMapper assetStocktakeTaskMapper;

    /**
     * 盘点明细 Mapper。
     */
    private final AssetStocktakeItemMapper assetStocktakeItemMapper;

    /**
     * 设备 Mapper。
     */
    private final AssetDeviceMapper assetDeviceMapper;

    /**
     * 资产流水服务。
     */
    private final AssetTransactionWriteService assetTransactionWriteService;

    /**
     * 获取盘点任务列表。
     *
     * @return 任务列表
     */
    public List<AssetStocktakeTaskVo> getList() {
        Long tenantId = requireCurrentUser().getTenantId();
        return assetStocktakeTaskMapper.selectList(new LambdaQueryWrapper<AssetStocktakeTask>()
                        .eq(AssetStocktakeTask::getTenantId, tenantId)
                        .orderByDesc(AssetStocktakeTask::getCreateTime))
                .stream()
                .map(this::toTaskVo)
                .toList();
    }
    /**
     * 获取盘点任务明细。
     *
     * @param id 任务 ID
     * @return 明细列表
     */
    public List<AssetStocktakeDetailVo> getDetail(Long id) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        requireTask(id, currentUser.getTenantId());
        return listTaskItems(id, currentUser.getTenantId())
                .stream()
                .map(this::toDetailVo)
                .toList();
    }
    /**
     * 创建盘点任务。
     *
     * @param request 创建请求
     * @return 任务详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetStocktakeTaskVo create(AssetStocktakeCreateRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        validateScope(request);
        List<AssetDevice> devices = queryDevicesInScope(
                currentUser.getTenantId(),
                request.getScopeType(),
                request.getScopeLocationId()
        );
        if (devices.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘点范围内没有可盘点设备");
        }

        AssetStocktakeTask task = new AssetStocktakeTask();
        task.setTenantId(currentUser.getTenantId());
        task.setName(normalizeRequiredText(request.getName(), "任务名称不能为空", 120));
        task.setScopeType(request.getScopeType());
        task.setScopeLocationId(request.getScopeLocationId());
        task.setStatus(AssetStocktakeStatusEnum.PROCESSING.getValue());
        task.setStartedAt(LocalDateTime.now());
        task.setRemark(normalizeOptionalText(request.getRemark(), 500));
        task.setCreatedUserId(currentUser.getUserId());
        assetStocktakeTaskMapper.insert(task);
        createSnapshotItems(task, devices);
        return toTaskVo(task);
    }
    /**
     * 提交盘点结果。
     *
     * @param request 盘点请求
     * @return 盘点明细
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetStocktakeDetailVo check(AssetStocktakeCheckRequest request) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetStocktakeTask task = requireTask(request.getTaskId(), currentUser.getTenantId());
        if (Objects.equals(task.getStatus(), AssetStocktakeStatusEnum.FINISHED.getValue())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘点任务已完成，不能继续提交");
        }

        AssetStocktakeItemResultEnum resultStatus = requireResultStatus(request.getResultStatus());
        AssetStocktakeItem item = requireItem(task.getId(), request.getDeviceId(), currentUser.getTenantId());
        AssetDevice device = loadDeviceInTenant(request.getDeviceId(), currentUser.getTenantId());
        Integer actualQuantity = AssetStocktakeQuantityHelper.resolveActualQuantity(
                request,
                item,
                resultStatus
        );
        AssetStocktakeQuantityHelper.validateResultQuantity(resultStatus, actualQuantity);
        item.setResultStatus(resultStatus.getValue());
        item.setActualQuantity(actualQuantity);
        item.setDifferenceQuantity(actualQuantity
                - AssetStocktakeQuantityHelper.resolveExpectedQuantity(item));
        item.setActualLocationId(resolveActualLocationId(request, device, resultStatus));
        item.setActualUserId(resolveActualUserId(request, device, resultStatus));
        item.setCheckedUserId(currentUser.getUserId());
        item.setCheckedAt(LocalDateTime.now());
        item.setRemark(normalizeOptionalText(request.getRemark(), 500));
        assetStocktakeItemMapper.updateById(item);
        return toDetailVo(item);
    }
    /**
     * 完成盘点任务。
     *
     * @param id 任务 ID
     * @return 任务详情
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetStocktakeTaskVo complete(Long id) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetStocktakeTask task = requireTask(id, currentUser.getTenantId());
        if (Objects.equals(task.getStatus(), AssetStocktakeStatusEnum.FINISHED.getValue())) {
            return toTaskVo(task);
        }

        List<AssetStocktakeItem> items = listTaskItems(task.getId(), currentUser.getTenantId());
        if (items.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘点任务没有明细，不能完成");
        }
        boolean hasUnchecked = items.stream()
                .anyMatch(item -> item.getResultStatus() == null || item.getActualQuantity() == null);
        if (hasUnchecked) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在未登记结果或数量的设备，不能完成盘点");
        }

        applyMissingDeviceStatus(items, currentUser.getTenantId(), currentUser.getUserId());
        task.setStatus(AssetStocktakeStatusEnum.FINISHED.getValue());
        task.setFinishedAt(LocalDateTime.now());
        assetStocktakeTaskMapper.updateById(task);
        return toTaskVo(task);
    }
    private void validateScope(AssetStocktakeCreateRequest request) {
        AssetStocktakeScopeTypeEnum scopeType = AssetStocktakeScopeTypeEnum.of(request.getScopeType());
        if (scopeType == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘点范围类型不支持");
        }
        if (scopeType == AssetStocktakeScopeTypeEnum.LOCATION
                && request.getScopeLocationId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "指定位置盘点必须选择范围位置");
        }
    }
    private List<AssetDevice> queryDevicesInScope(Long tenantId,
                                                  Integer scopeType,
                                                  Long scopeLocationId) {
        AssetStocktakeScopeTypeEnum parsedScopeType = AssetStocktakeScopeTypeEnum.of(scopeType);
        LambdaQueryWrapper<AssetDevice> queryWrapper = new LambdaQueryWrapper<AssetDevice>()
                .eq(AssetDevice::getTenantId, tenantId)
                .eq(AssetDevice::getDeleted, 0)
                .ne(AssetDevice::getStatus, AssetDeviceStatusEnum.SCRAPPED.getValue())
                .orderByAsc(AssetDevice::getId);
        if (parsedScopeType == AssetStocktakeScopeTypeEnum.LOCATION) {
            queryWrapper.eq(AssetDevice::getLocationId, scopeLocationId);
        }
        return assetDeviceMapper.selectList(queryWrapper);
    }
    private void createSnapshotItems(AssetStocktakeTask task, List<AssetDevice> devices) {
        for (AssetDevice device : devices) {
            AssetStocktakeItem item = new AssetStocktakeItem();
            item.setTenantId(task.getTenantId());
            item.setTaskId(task.getId());
            item.setDeviceId(device.getId());
            item.setExpectedQuantity(1);
            item.setRemark("");
            assetStocktakeItemMapper.insert(item);
        }
    }
    private AssetStocktakeItemResultEnum requireResultStatus(Integer resultStatus) {
        if (AssetStocktakeItemResultEnum.FOUND.getValue().equals(resultStatus)) {
            return AssetStocktakeItemResultEnum.FOUND;
        }
        if (AssetStocktakeItemResultEnum.MISSING.getValue().equals(resultStatus)) {
            return AssetStocktakeItemResultEnum.MISSING;
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "盘点结果状态不支持");
    }
    private AssetStocktakeItem requireItem(Long taskId, Long deviceId, Long tenantId) {
        AssetStocktakeItem item = assetStocktakeItemMapper.selectOne(
                new LambdaQueryWrapper<AssetStocktakeItem>()
                        .eq(AssetStocktakeItem::getTenantId, tenantId)
                        .eq(AssetStocktakeItem::getTaskId, taskId)
                        .eq(AssetStocktakeItem::getDeviceId, deviceId)
                        .last("limit 1")
        );
        if (item == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "设备不在当前盘点任务范围内");
        }
        return item;
    }

    private Long resolveActualLocationId(AssetStocktakeCheckRequest request,
                                         AssetDevice device,
                                         AssetStocktakeItemResultEnum resultStatus) {
        if (request.getActualLocationId() != null) {
            return request.getActualLocationId();
        }
        if (resultStatus == AssetStocktakeItemResultEnum.MISSING) {
            return null;
        }
        if (device == null) {
            return null;
        }
        return device.getLocationId();
    }
    private AssetDevice loadDeviceInTenant(Long deviceId, Long tenantId) {
        AssetDevice device = assetDeviceMapper.selectById(deviceId);
        if (device == null || !Objects.equals(device.getTenantId(), tenantId)) {
            return null;
        }
        return device;
    }
    private Long resolveActualUserId(AssetStocktakeCheckRequest request,
                                     AssetDevice device,
                                     AssetStocktakeItemResultEnum resultStatus) {
        if (request.getActualUserId() != null) {
            return request.getActualUserId();
        }
        if (resultStatus == AssetStocktakeItemResultEnum.MISSING) {
            return null;
        }
        if (device == null) {
            return null;
        }
        return device.getCurrentUserId();
    }
    private List<AssetStocktakeItem> listTaskItems(Long taskId, Long tenantId) {
        return assetStocktakeItemMapper.selectList(new LambdaQueryWrapper<AssetStocktakeItem>()
                .eq(AssetStocktakeItem::getTenantId, tenantId)
                .eq(AssetStocktakeItem::getTaskId, taskId)
                .orderByAsc(AssetStocktakeItem::getId));
    }
    private void applyMissingDeviceStatus(List<AssetStocktakeItem> items,
                                          Long tenantId,
                                          Long operatorUserId) {
        for (AssetStocktakeItem item : items) {
            if (!AssetStocktakeItemResultEnum.MISSING.getValue().equals(item.getResultStatus())) {
                continue;
            }
            AssetDevice device = assetDeviceMapper.selectById(item.getDeviceId());
            if (device == null || !Objects.equals(device.getTenantId(), tenantId)) {
                continue;
            }
            if (Objects.equals(device.getStatus(), AssetDeviceStatusEnum.SCRAPPED.getValue())) {
                continue;
            }
            device.setStatus(AssetDeviceStatusEnum.LOST.getValue());
            device.setCurrentUserId(null);
            device.setLastOperatedAt(LocalDateTime.now());
            assetDeviceMapper.updateById(device);
            assetTransactionWriteService.writeStocktakeLoss(device, operatorUserId, item.getRemark());
        }
    }
    private AssetStocktakeTask requireTask(Long id, Long tenantId) {
        AssetStocktakeTask task = assetStocktakeTaskMapper.selectById(id);
        if (task == null || !Objects.equals(task.getTenantId(), tenantId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "盘点任务不存在");
        }
        return task;
    }
    private AuthCurrentUserDto requireCurrentUser() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser;
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

    private AssetStocktakeTaskVo toTaskVo(AssetStocktakeTask task) {
        return AssetStocktakeTaskVo.builder()
                .id(task.getId())
                .name(task.getName())
                .status(task.getStatus())
                .scopeType(task.getScopeType())
                .scopeLocationId(task.getScopeLocationId())
                .startedAt(task.getStartedAt())
                .finishedAt(task.getFinishedAt())
                .remark(task.getRemark())
                .createdUserId(task.getCreatedUserId())
                .totalCount(countTaskItems(task.getId(), null))
                .checkedCount(countCheckedItems(task.getId()))
                .foundCount(countTaskItems(task.getId(), AssetStocktakeItemResultEnum.FOUND.getValue()))
                .missingCount(countTaskItems(task.getId(), AssetStocktakeItemResultEnum.MISSING.getValue()))
                .build();
    }

    private Long countCheckedItems(Long taskId) {
        return normalizeCount(assetStocktakeItemMapper.selectCount(
                new LambdaQueryWrapper<AssetStocktakeItem>()
                        .eq(AssetStocktakeItem::getTaskId, taskId)
                        .isNotNull(AssetStocktakeItem::getResultStatus)
        ));
    }

    private Long countTaskItems(Long taskId, Integer resultStatus) {
        LambdaQueryWrapper<AssetStocktakeItem> queryWrapper = new LambdaQueryWrapper<AssetStocktakeItem>()
                .eq(AssetStocktakeItem::getTaskId, taskId);
        if (resultStatus != null) {
            queryWrapper.eq(AssetStocktakeItem::getResultStatus, resultStatus);
        }
        return normalizeCount(assetStocktakeItemMapper.selectCount(queryWrapper));
    }

    private Long normalizeCount(Long count) {
        if (count == null) {
            return 0L;
        }
        return count;
    }

    private AssetStocktakeDetailVo toDetailVo(AssetStocktakeItem item) {
        AssetDevice device = assetDeviceMapper.selectById(item.getDeviceId());
        return AssetStocktakeVoAssembler.toDetailVo(item, device);
    }
}
