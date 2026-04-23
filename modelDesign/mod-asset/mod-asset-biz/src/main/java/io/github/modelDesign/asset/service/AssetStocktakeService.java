package io.github.modelDesign.asset.service;

import io.github.modelDesign.asset.domain.AssetStocktakeTask;
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
        return assetStocktakeTaskMapper.selectList(null)
                .stream()
                .filter(item -> Objects.equals(item.getTenantId(), tenantId))
                .map(this::toTaskVo)
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
        return AssetStocktakeDetailVo.builder()
                .taskId(task.getId())
                .deviceId(request.getDeviceId())
                .resultStatus(request.getResultStatus())
                .build();
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
        task.setStatus(AssetStocktakeStatusEnum.FINISHED.getValue());
        task.setFinishedAt(LocalDateTime.now());
        assetStocktakeTaskMapper.updateById(task);
        return toTaskVo(task);
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
                .build();
    }
}
