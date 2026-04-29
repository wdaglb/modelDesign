package io.github.modelDesign.asset.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetStocktakeItem;
import io.github.modelDesign.asset.domain.AssetStocktakeTask;
import io.github.modelDesign.asset.enums.AssetStocktakeItemResultEnum;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeItemMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.mapper.AssetStocktakeTaskMapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 盘点结果导出服务。
 *
 * 导出链路独立封装，避免盘点任务主服务继续膨胀，同时把 EasyExcel 依赖限制在
 * 导出场景本身，减少后续维护时的职责交叉。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssetStocktakeExportService {
    /**
     * Excel 文件内容类型。
     */
    private static final String EXCEL_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    /**
     * 盘点时间导出格式。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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
     * 位置 Mapper。
     */
    private final AssetLocationMapper assetLocationMapper;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 导出指定盘点任务的结果明细。
     *
     * @param id       任务 ID
     * @param response HTTP 响应
     */
    public void export(Long id, HttpServletResponse response) {
        AuthCurrentUserDto currentUser = requireCurrentUser();
        AssetStocktakeTask task = requireTask(id, currentUser.getTenantId());
        List<AssetStocktakeItem> items = assetStocktakeItemMapper.selectList(
                new LambdaQueryWrapper<AssetStocktakeItem>()
                        .eq(AssetStocktakeItem::getTenantId, currentUser.getTenantId())
                        .eq(AssetStocktakeItem::getTaskId, id)
                        .orderByAsc(AssetStocktakeItem::getId)
        );
        List<AssetStocktakeExportRow> rows = buildRows(task, items, currentUser.getTenantId());
        writeExcel(response, task.getName(), rows);
    }

    private List<AssetStocktakeExportRow> buildRows(AssetStocktakeTask task,
                                                    List<AssetStocktakeItem> items,
                                                    Long tenantId) {
        if (items.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, AssetDevice> deviceMap = loadDeviceMap(items, tenantId);
        Map<Long, String> locationNameMap = loadLocationNameMap(items, deviceMap, tenantId);
        Map<Long, String> userNameMap = loadUserNameMap(items, deviceMap, tenantId);
        return items.stream()
                .map(item -> toExportRow(
                        task,
                        item,
                        deviceMap.get(item.getDeviceId()),
                        locationNameMap,
                        userNameMap
                ))
                .toList();
    }

    private Map<Long, AssetDevice> loadDeviceMap(List<AssetStocktakeItem> items, Long tenantId) {
        List<Long> deviceIds = items.stream()
                .map(AssetStocktakeItem::getDeviceId)
                .distinct()
                .toList();
        return assetDeviceMapper.selectBatchIds(deviceIds)
                .stream()
                .filter(device -> Objects.equals(device.getTenantId(), tenantId))
                .collect(Collectors.toMap(
                        AssetDevice::getId,
                        Function.identity(),
                        (left, right) -> left
                ));
    }

    private Map<Long, String> loadLocationNameMap(List<AssetStocktakeItem> items,
                                                  Map<Long, AssetDevice> deviceMap,
                                                  Long tenantId) {
        List<Long> locationIds = items.stream()
                .flatMap(item -> java.util.stream.Stream.of(
                        item.getActualLocationId(),
                        readExpectedLocationId(deviceMap.get(item.getDeviceId()))
                ))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (locationIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return assetLocationMapper.selectBatchIds(locationIds).stream()
                .filter(location -> Objects.equals(location.getTenantId(), tenantId))
                .collect(Collectors.toMap(
                        io.github.modelDesign.asset.domain.AssetLocation::getId,
                        io.github.modelDesign.asset.domain.AssetLocation::getName,
                        (left, right) -> left
                ));
    }

    private Map<Long, String> loadUserNameMap(List<AssetStocktakeItem> items,
                                              Map<Long, AssetDevice> deviceMap,
                                              Long tenantId) {
        List<Long> userIds = items.stream()
                .flatMap(item -> java.util.stream.Stream.of(
                        item.getActualUserId(),
                        readExpectedUserId(deviceMap.get(item.getDeviceId())),
                        item.getCheckedUserId()
                ))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(userIds);
        return userMap.values().stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        AuthUserSimpleDto::getId,
                        this::readUserName,
                        (left, right) -> left
                ));
    }

    private AssetStocktakeExportRow toExportRow(AssetStocktakeTask task,
                                                AssetStocktakeItem item,
                                                AssetDevice device,
                                                Map<Long, String> locationNameMap,
                                                Map<Long, String> userNameMap) {
        return AssetStocktakeExportRow.builder()
                .taskName(task.getName())
                .assetCode(readAssetCode(device))
                .deviceName(readDeviceName(device))
                .expectedQuantity(AssetStocktakeQuantityHelper.resolveExpectedQuantity(item))
                .actualQuantity(item.getActualQuantity())
                .differenceQuantity(item.getDifferenceQuantity())
                .resultLabel(resolveResultLabel(item.getResultStatus()))
                .expectedLocationName(readLocationName(
                        readExpectedLocationId(device),
                        locationNameMap
                ))
                .expectedUserName(readUserName(
                        readExpectedUserId(device),
                        userNameMap
                ))
                .actualLocationName(readLocationName(item.getActualLocationId(), locationNameMap))
                .actualUserName(readUserName(item.getActualUserId(), userNameMap))
                .checkedUserName(readUserName(item.getCheckedUserId(), userNameMap))
                .checkedAt(formatCheckedAt(item))
                .remark(item.getRemark())
                .build();
    }

    private void writeExcel(HttpServletResponse response,
                            String taskName,
                            List<AssetStocktakeExportRow> rows) {
        try {
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(EXCEL_CONTENT_TYPE);
            response.setHeader(
                    "Content-Disposition",
                    "attachment;filename*=UTF-8''" + encodeFileName(taskName)
            );
            EasyExcel.write(response.getOutputStream(), AssetStocktakeExportRow.class)
                    .autoCloseStream(false)
                    .sheet("盘点结果")
                    .doWrite(rows);
        } catch (Exception ex) {
            resetResponseSafely(response);
            log.error("导出盘点结果失败，taskName={}", taskName, ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "导出盘点结果失败");
        }
    }

    private void resetResponseSafely(HttpServletResponse response) {
        try {
            if (!response.isCommitted()) {
                response.reset();
            }
        } catch (Exception ex) {
            log.warn("导出失败后重置响应失败", ex);
        }
    }

    private String encodeFileName(String taskName) {
        String normalizedTaskName = normalizeFileName(taskName);
        String fileName = normalizedTaskName + "-盘点结果.xlsx";
        return URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String normalizeFileName(String taskName) {
        if (!StringUtils.hasText(taskName)) {
            return "盘点任务";
        }
        String normalizedTaskName = taskName.trim()
                .replaceAll("[\\\\/:*?\"<>|]+", "_");
        if (!StringUtils.hasText(normalizedTaskName)) {
            return "盘点任务";
        }
        return normalizedTaskName;
    }

    private String resolveResultLabel(Integer resultStatus) {
        if (AssetStocktakeItemResultEnum.FOUND.getValue().equals(resultStatus)) {
            return AssetStocktakeItemResultEnum.FOUND.getLabel();
        }
        if (AssetStocktakeItemResultEnum.MISSING.getValue().equals(resultStatus)) {
            return AssetStocktakeItemResultEnum.MISSING.getLabel();
        }
        return "";
    }

    private String formatCheckedAt(AssetStocktakeItem item) {
        if (item.getCheckedAt() == null) {
            return "";
        }
        return item.getCheckedAt().format(DATE_TIME_FORMATTER);
    }

    private String readAssetCode(AssetDevice device) {
        if (device == null) {
            return "";
        }
        return device.getAssetCode();
    }

    private String readDeviceName(AssetDevice device) {
        if (device == null) {
            return "";
        }
        return device.getDeviceName();
    }

    private Long readExpectedLocationId(AssetDevice device) {
        if (device == null) {
            return null;
        }
        return device.getLocationId();
    }

    private Long readExpectedUserId(AssetDevice device) {
        if (device == null) {
            return null;
        }
        return device.getCurrentUserId();
    }

    private String readLocationName(Long locationId, Map<Long, String> locationNameMap) {
        if (locationId == null) {
            return "";
        }
        return locationNameMap.getOrDefault(locationId, String.valueOf(locationId));
    }

    private String readUserName(Long userId, Map<Long, String> userNameMap) {
        if (userId == null) {
            return "";
        }
        return userNameMap.getOrDefault(userId, String.valueOf(userId));
    }

    private String readUserName(AuthUserSimpleDto user) {
        if (user == null) {
            return "";
        }
        if (!StringUtils.hasText(user.getNickname())) {
            return String.valueOf(user.getId());
        }
        return user.getNickname();
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
        if (currentUser == null || currentUser.getTenantId() == null
                || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser;
    }
}
