package io.github.modelDesign.asset.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.asset.domain.AssetCategory;
import io.github.modelDesign.asset.domain.AssetDevice;
import io.github.modelDesign.asset.domain.AssetLocation;
import io.github.modelDesign.asset.enums.AssetDeviceStatusEnum;
import io.github.modelDesign.asset.mapper.AssetCategoryMapper;
import io.github.modelDesign.asset.mapper.AssetDeviceMapper;
import io.github.modelDesign.asset.mapper.AssetLocationMapper;
import io.github.modelDesign.asset.response.AssetDeviceImportResultVo;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 设备批量入库导入服务。
 *
 * 导入过程采用“整批校验通过后再入库”的事务策略，任何一行错误都会阻止整批写入，
 * 避免资产台账出现部分成功、部分失败后需要人工对账的情况。
 */
@Service
@RequiredArgsConstructor
public class AssetDeviceImportService {
    /**
     * 单次导入最大行数。
     */
    private static final int MAX_IMPORT_ROWS = 1000;

    /**
     * 购置日期格式。
     */
    private static final List<DateTimeFormatter> PURCHASE_DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("yyyy/M/d")
    );

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
     * 批量导入设备库存。
     *
     * @param file Excel 文件
     * @return 导入结果
     */
    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceImportResultVo importDevices(MultipartFile file) {
        validateImportFile(file);
        AuthCurrentUserDto currentUser = requireCurrentUser();
        List<AssetDeviceImportRow> rawRows = readRows(file);
        List<AssetDeviceImportNormalizedRow> rows = normalizeRows(rawRows);
        validateRowLimit(rows);
        validateDuplicateAssetCodesInFile(rows);
        validateDuplicateAssetCodesInDatabase(rows, currentUser.getTenantId());

        Map<String, AssetCategory> categoryMap = loadCategoryMap(rows, currentUser.getTenantId());
        Map<String, AssetLocation> locationMap = loadLocationMap(rows, currentUser.getTenantId());
        validateReferenceNames(rows, categoryMap, locationMap);
        List<AssetDevice> entities = buildEntities(rows, categoryMap, locationMap, currentUser);

        for (AssetDevice entity : entities) {
            assetDeviceMapper.insert(entity);
            assetTransactionWriteService.writeInbound(
                    entity,
                    currentUser.getUserId(),
                    entity.getRemark()
            );
        }

        return AssetDeviceImportResultVo.builder()
                .importedCount(entities.size())
                .build();
    }

    private void validateImportFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "请选择要导入的 Excel 文件");
        }
        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)
                || !originalFilename.toLowerCase().endsWith(".xlsx")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "仅支持导入 .xlsx 文件");
        }
    }

    private AuthCurrentUserDto requireCurrentUser() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        if (currentUser == null || currentUser.getTenantId() == null
                || currentUser.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return currentUser;
    }

    private List<AssetDeviceImportRow> readRows(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            return EasyExcel.read(inputStream)
                    .head(AssetDeviceImportRow.class)
                    .sheet()
                    .doReadSync();
        } catch (Exception ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "读取 Excel 文件失败，请检查模板格式");
        }
    }

    private List<AssetDeviceImportNormalizedRow> normalizeRows(List<AssetDeviceImportRow> rawRows) {
        List<AssetDeviceImportNormalizedRow> rows = new ArrayList<>();
        for (int index = 0; index < rawRows.size(); index++) {
            AssetDeviceImportRow rawRow = rawRows.get(index);
            if (!hasAnyContent(rawRow)) {
                continue;
            }
            int rowNumber = index + 2;
            rows.add(new AssetDeviceImportNormalizedRow(
                    rowNumber,
                    normalizeRequiredText(rawRow.getDeviceName(), rowNumber, "设备名称", 100),
                    normalizeRequiredText(rawRow.getCategoryName(), rowNumber, "设备分类", 100),
                    normalizeRequiredText(rawRow.getAssetCode(), rowNumber, "资产编号", 64),
                    normalizeOptionalText(rawRow.getSerialNumber(), rowNumber, "序列号", 128),
                    normalizeRequiredText(rawRow.getLocationName(), rowNumber, "所在位置", 100),
                    parsePurchaseDate(rawRow.getPurchaseDate(), rowNumber),
                    normalizeOptionalText(rawRow.getRemark(), rowNumber, "备注", 500)
            ));
        }
        if (rows.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "导入文件没有可入库的数据");
        }
        return rows;
    }

    private boolean hasAnyContent(AssetDeviceImportRow row) {
        return StringUtils.hasText(row.getDeviceName())
                || StringUtils.hasText(row.getCategoryName())
                || StringUtils.hasText(row.getAssetCode())
                || StringUtils.hasText(row.getSerialNumber())
                || StringUtils.hasText(row.getLocationName())
                || StringUtils.hasText(row.getPurchaseDate())
                || StringUtils.hasText(row.getRemark());
    }

    private void validateRowLimit(List<AssetDeviceImportNormalizedRow> rows) {
        if (rows.size() > MAX_IMPORT_ROWS) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "单次最多导入 " + MAX_IMPORT_ROWS + " 条设备"
            );
        }
    }

    private void validateDuplicateAssetCodesInFile(List<AssetDeviceImportNormalizedRow> rows) {
        Set<String> seenAssetCodes = new HashSet<>();
        Set<String> duplicatedAssetCodes = new LinkedHashSet<>();
        for (AssetDeviceImportNormalizedRow row : rows) {
            if (!seenAssetCodes.add(row.assetCode())) {
                duplicatedAssetCodes.add(row.assetCode());
            }
        }
        if (!duplicatedAssetCodes.isEmpty()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "导入文件内资产编号重复：" + String.join("、", duplicatedAssetCodes)
            );
        }
    }

    private void validateDuplicateAssetCodesInDatabase(List<AssetDeviceImportNormalizedRow> rows, Long tenantId) {
        List<String> assetCodes = rows.stream()
                .map(AssetDeviceImportNormalizedRow::assetCode)
                .toList();
        List<AssetDevice> existedDevices = assetDeviceMapper.selectList(
                new LambdaQueryWrapper<AssetDevice>()
                        .eq(AssetDevice::getTenantId, tenantId)
                        .eq(AssetDevice::getDeleted, 0)
                        .in(AssetDevice::getAssetCode, assetCodes)
        );
        if (!existedDevices.isEmpty()) {
            String duplicatedAssetCodes = existedDevices.stream()
                    .map(AssetDevice::getAssetCode)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining("、"));
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "资产编号已存在：" + duplicatedAssetCodes
            );
        }
    }

    private Map<String, AssetCategory> loadCategoryMap(List<AssetDeviceImportNormalizedRow> rows, Long tenantId) {
        List<String> categoryNames = rows.stream()
                .map(AssetDeviceImportNormalizedRow::categoryName)
                .distinct()
                .toList();
        List<AssetCategory> categories = assetCategoryMapper.selectList(new LambdaQueryWrapper<AssetCategory>()
                        .eq(AssetCategory::getTenantId, tenantId)
                        .eq(AssetCategory::getStatus, 1)
                        .in(AssetCategory::getName, categoryNames));
        validateDuplicatedReferenceNames(
                categories.stream().map(AssetCategory::getName).toList(),
                "分类"
        );
        return categories
                .stream()
                .collect(Collectors.toMap(
                        AssetCategory::getName,
                        Function.identity(),
                        (left, right) -> left
                ));
    }

    private Map<String, AssetLocation> loadLocationMap(List<AssetDeviceImportNormalizedRow> rows, Long tenantId) {
        List<String> locationNames = rows.stream()
                .map(AssetDeviceImportNormalizedRow::locationName)
                .distinct()
                .toList();
        List<AssetLocation> locations = assetLocationMapper.selectList(
                new LambdaQueryWrapper<AssetLocation>()
                        .eq(AssetLocation::getTenantId, tenantId)
                        .eq(AssetLocation::getStatus, 1)
                        .in(AssetLocation::getName, locationNames)
        );
        validateDuplicatedReferenceNames(
                locations.stream().map(AssetLocation::getName).toList(),
                "位置"
        );
        return locations.stream()
                .collect(Collectors.toMap(
                        AssetLocation::getName,
                        Function.identity(),
                        (left, right) -> left
                ));
    }

    private void validateDuplicatedReferenceNames(List<String> names, String referenceType) {
        Map<String, Long> nameCountMap = names.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        List<String> duplicatedNames = nameCountMap.entrySet()
                .stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .toList();
        if (!duplicatedNames.isEmpty()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    referenceType + "名称不唯一，无法按名称导入："
                            + String.join("、", duplicatedNames)
            );
        }
    }

    private void validateReferenceNames(List<AssetDeviceImportNormalizedRow> rows,
                                        Map<String, AssetCategory> categoryMap,
                                        Map<String, AssetLocation> locationMap) {
        for (AssetDeviceImportNormalizedRow row : rows) {
            if (!categoryMap.containsKey(row.categoryName())) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST.value(),
                        "第 " + row.rowNumber() + " 行设备分类不存在或已停用：" + row.categoryName()
                );
            }
            if (!locationMap.containsKey(row.locationName())) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST.value(),
                        "第 " + row.rowNumber() + " 行所在位置不存在或已停用：" + row.locationName()
                );
            }
        }
    }

    private List<AssetDevice> buildEntities(List<AssetDeviceImportNormalizedRow> rows,
                                            Map<String, AssetCategory> categoryMap,
                                            Map<String, AssetLocation> locationMap,
                                            AuthCurrentUserDto currentUser) {
        LocalDateTime operatedAt = LocalDateTime.now();
        return rows.stream()
                .map(row -> buildEntity(row, categoryMap, locationMap, currentUser, operatedAt))
                .toList();
    }

    private AssetDevice buildEntity(AssetDeviceImportNormalizedRow row,
                                    Map<String, AssetCategory> categoryMap,
                                    Map<String, AssetLocation> locationMap,
                                    AuthCurrentUserDto currentUser,
                                    LocalDateTime operatedAt) {
        AssetDevice entity = new AssetDevice();
        entity.setTenantId(currentUser.getTenantId());
        entity.setDeviceName(row.deviceName());
        entity.setCategoryId(categoryMap.get(row.categoryName()).getId());
        entity.setAssetCode(row.assetCode());
        entity.setSerialNumber(row.serialNumber());
        entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        entity.setLocationId(locationMap.get(row.locationName()).getId());
        entity.setPurchaseDate(row.purchaseDate());
        entity.setRemark(row.remark());
        entity.setDeleted(0);
        entity.setLastOperatedAt(operatedAt);
        return entity;
    }

    private String normalizeRequiredText(String value,
                                         int rowNumber,
                                         String fieldName,
                                         int maxLength) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "第 " + rowNumber + " 行" + fieldName + "不能为空"
            );
        }
        return normalizeLength(value, rowNumber, fieldName, maxLength);
    }

    private String normalizeOptionalText(String value,
                                         int rowNumber,
                                         String fieldName,
                                         int maxLength) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return normalizeLength(value, rowNumber, fieldName, maxLength);
    }

    private String normalizeLength(String value, int rowNumber, String fieldName, int maxLength) {
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "第 " + rowNumber + " 行" + fieldName + "长度不能超过 " + maxLength + " 个字符"
            );
        }
        return normalizedValue;
    }

    private LocalDate parsePurchaseDate(String value, int rowNumber) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalizedValue = value.trim();
        for (DateTimeFormatter formatter : PURCHASE_DATE_FORMATTERS) {
            try {
                return LocalDate.parse(normalizedValue, formatter);
            } catch (DateTimeParseException ignored) {
                /**
                 * 同一输入会按多个常见日期格式依次尝试；
                 * 当前格式不匹配时继续尝试下一个格式。
                 */
            }
        }
        throw new BusinessException(
                HttpStatus.BAD_REQUEST.value(),
                "第 " + rowNumber + " 行购置日期格式应为 yyyy-MM-dd"
        );
    }
}
