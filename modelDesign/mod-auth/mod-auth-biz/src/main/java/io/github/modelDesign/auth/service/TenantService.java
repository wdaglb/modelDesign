package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.Tenant;
import io.github.modelDesign.auth.mapper.TenantMapper;
import io.github.modelDesign.auth.request.TenantAddRequest;
import io.github.modelDesign.auth.request.TenantDeleteRequest;
import io.github.modelDesign.auth.request.TenantListRequest;
import io.github.modelDesign.auth.request.TenantUpdateRequest;
import io.github.modelDesign.auth.request.TenantUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.TenantListItemVo;
import io.github.modelDesign.auth.response.TenantOptionVo;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 租户服务。
 */
@Service
@RequiredArgsConstructor
public class TenantService extends ServiceImpl<TenantMapper, Tenant> implements IService<Tenant> {
    /**
     * 默认租户 ID。
     */
    public static final long DEFAULT_TENANT_ID = 1L;

    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取租户列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<TenantListItemVo> getList(TenantListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String code = normalizeKeyword(request.getCode());
        String name = normalizeKeyword(request.getName());
        Integer status = null;
        if (request.getIsDisable() != null) {
            status = resolveStatus(request.getIsDisable());
        }

        List<Tenant> allTenants = lambdaQuery()
                .eq(Tenant::getDeleted, 0)
                .like(StringUtils.hasText(code), Tenant::getCode, code)
                .like(StringUtils.hasText(name), Tenant::getName, name)
                .eq(status != null, Tenant::getStatus, status)
                .orderByDesc(Tenant::getUpdateTime)
                .list();

        long total = allTenants.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<Tenant> pageTenants = allTenants.subList((int) fromIndex, (int) toIndex);

        List<TenantListItemVo> items = new ArrayList<>();
        for (Tenant tenant : pageTenants) {
            items.add(toTenantListItem(tenant));
        }
        return new PageResponse<>(items, total);
    }

    /**
     * 新增租户。
     *
     * @param request 新增请求
     * @return 租户列表项
     */
    public TenantListItemVo add(TenantAddRequest request) {
        validateCode(request.getCode(), null);
        Tenant tenant = new Tenant();
        fillTenant(tenant, request.getCode(), request.getName(), request.getDescription(), request.getIsDisable());
        tenant.setDeleted(0);
        save(tenant);
        return toTenantListItem(tenant);
    }

    /**
     * 编辑租户。
     *
     * @param id 租户 ID
     * @param request 编辑请求
     * @return 租户列表项
     */
    public TenantListItemVo update(Long id, TenantUpdateRequest request) {
        Tenant tenant = requireTenant(id);
        validateCode(request.getCode(), id);
        validateDefaultTenantDisable(id, request.getIsDisable());
        fillTenant(tenant, request.getCode(), request.getName(), request.getDescription(), request.getIsDisable());
        updateById(tenant);
        return toTenantListItem(tenant);
    }

    /**
     * 修改租户状态。
     *
     * @param request 状态请求
     */
    public void updateStatus(TenantUpdateStatusRequest request) {
        Tenant tenant = requireTenant(request.getId());
        validateDefaultTenantDisable(tenant.getId(), request.getIsDisable());
        lambdaUpdate()
                .eq(Tenant::getId, tenant.getId())
                .set(Tenant::getStatus, resolveStatus(request.getIsDisable()))
                .update();
    }

    /**
     * 删除租户。
     *
     * @param request 删除请求
     */
    public void delete(TenantDeleteRequest request) {
        Tenant tenant = requireTenant(request.getId());
        validateDefaultTenantDelete(tenant.getId());
        lambdaUpdate()
                .eq(Tenant::getId, tenant.getId())
                .set(Tenant::getDeleted, 1)
                .update();
    }

    /**
     * 获取租户下拉选项。
     *
     * @return 租户下拉选项
     */
    public List<TenantOptionVo> getOptions() {
        List<Tenant> tenants = lambdaQuery()
                .eq(Tenant::getDeleted, 0)
                .eq(Tenant::getStatus, 1)
                .orderByAsc(Tenant::getId)
                .list();
        List<TenantOptionVo> options = new ArrayList<>();
        for (Tenant tenant : tenants) {
            options.add(TenantOptionVo.builder()
                    .id(tenant.getId())
                    .code(tenant.getCode())
                    .name(tenant.getName())
                    .build());
        }
        return options;
    }

    /**
     * 校验租户可用于用户绑定。
     *
     * @param tenantId 租户 ID
     * @return 规范化后的租户 ID
     */
    public Long requireAssignableTenantId(Long tenantId) {
        if (tenantId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不能为空");
        }
        Tenant tenant = getById(tenantId);
        if (tenant == null || Objects.equals(tenant.getDeleted(), 1)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不存在");
        }
        if (!Objects.equals(tenant.getStatus(), 1)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户已被禁用，不能继续分配");
        }
        return tenant.getId();
    }

    /**
     * 校验租户可用于登录。
     *
     * @param tenantId 租户 ID
     */
    public void validateLoginTenant(Long tenantId) {
        if (tenantId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户未绑定租户");
        }
        Tenant tenant = getById(tenantId);
        if (tenant == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户所属租户不存在");
        }
        if (Objects.equals(tenant.getDeleted(), 1)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户所属租户已删除");
        }
        if (!Objects.equals(tenant.getStatus(), 1)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户所属租户已被禁用");
        }
    }

    /**
     * 获取租户展示名称映射。
     *
     * @param tenantIds 租户 ID 集合
     * @return 租户 ID 到展示名称的映射
     */
    public Map<Long, String> getDisplayNameMapByIds(Collection<Long> tenantIds) {
        if (tenantIds == null || tenantIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> distinctIds = new LinkedHashSet<>();
        for (Long tenantId : tenantIds) {
            if (tenantId != null) {
                distinctIds.add(tenantId);
            }
        }
        if (distinctIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Tenant> tenants = getBaseMapper().selectBatchIds(distinctIds);
        Map<Long, String> tenantNameMap = new LinkedHashMap<>();
        for (Tenant tenant : tenants) {
            String displayName = tenant.getName();
            if (Objects.equals(tenant.getDeleted(), 1)) {
                displayName = tenant.getName() + "（已删除）";
            }
            tenantNameMap.put(tenant.getId(), displayName);
        }
        for (Long tenantId : distinctIds) {
            if (!tenantNameMap.containsKey(tenantId)) {
                tenantNameMap.put(tenantId, "租户已删除");
            }
        }
        return tenantNameMap;
    }

    /**
     * 获取租户，不存在则抛异常。
     *
     * @param id 租户 ID
     * @return 租户实体
     */
    public Tenant requireTenant(Long id) {
        Tenant tenant = lambdaQuery()
                .eq(Tenant::getId, id)
                .eq(Tenant::getDeleted, 0)
                .last("limit 1")
                .one();
        if (tenant == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "租户不存在");
        }
        return tenant;
    }

    /**
     * 填充租户字段。
     *
     * @param tenant 租户实体
     * @param code 租户编码
     * @param name 租户名称
     * @param description 租户描述
     * @param isDisable 是否禁用
     */
    private void fillTenant(Tenant tenant, String code, String name, String description, Boolean isDisable) {
        tenant.setCode(normalizeRequiredValue(code, "租户编码不能为空"));
        tenant.setName(normalizeRequiredValue(name, "租户名称不能为空"));
        tenant.setDescription(normalizeDescription(description));
        tenant.setStatus(resolveStatus(isDisable));
    }

    /**
     * 校验租户编码唯一性。
     *
     * @param code 租户编码
     * @param currentId 当前租户 ID
     */
    private void validateCode(String code, Long currentId) {
        String normalizedCode = normalizeRequiredValue(code, "租户编码不能为空");
        boolean exists = lambdaQuery()
                .eq(Tenant::getDeleted, 0)
                .apply("LOWER(\"code\") = {0}", normalizedCode.toLowerCase(Locale.ROOT))
                .ne(currentId != null, Tenant::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户编码已存在");
        }
    }

    /**
     * 校验默认租户不能被禁用。
     *
     * @param tenantId 租户 ID
     * @param isDisable 是否禁用
     */
    private void validateDefaultTenantDisable(Long tenantId, Boolean isDisable) {
        if (!Objects.equals(tenantId, DEFAULT_TENANT_ID)) {
            return;
        }
        if (Boolean.TRUE.equals(isDisable)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "默认租户不允许禁用");
        }
    }

    /**
     * 校验默认租户不能被删除。
     *
     * @param tenantId 租户 ID
     */
    private void validateDefaultTenantDelete(Long tenantId) {
        if (Objects.equals(tenantId, DEFAULT_TENANT_ID)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "默认租户不允许删除");
        }
    }

    /**
     * 转换租户列表项。
     *
     * @param tenant 租户实体
     * @return 租户列表项
     */
    private TenantListItemVo toTenantListItem(Tenant tenant) {
        boolean disable = !Objects.equals(tenant.getStatus(), 1);
        return TenantListItemVo.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .description(tenant.getDescription())
                .isDisable(disable)
                .createdAt(formatDateTime(tenant.getCreateTime()))
                .updatedAt(formatDateTime(tenant.getUpdateTime()))
                .build();
    }

    /**
     * 规范化关键字。
     *
     * @param value 原始值
     * @return 规范化后的值
     */
    private String normalizeKeyword(String value) {
        if (value == null) {
            return null;
        }
        String trimmedValue = value.trim();
        if (!StringUtils.hasText(trimmedValue)) {
            return null;
        }
        return trimmedValue;
    }

    /**
     * 规范化必填字符串。
     *
     * @param value 原始值
     * @param errorMessage 错误提示
     * @return 规范化后的值
     */
    private String normalizeRequiredValue(String value, String errorMessage) {
        String normalizedValue = normalizeKeyword(value);
        if (!StringUtils.hasText(normalizedValue)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), errorMessage);
        }
        return normalizedValue;
    }

    /**
     * 规范化描述。
     *
     * @param description 原始描述
     * @return 规范化后的描述
     */
    private String normalizeDescription(String description) {
        if (!StringUtils.hasText(description)) {
            return "";
        }
        return description.trim();
    }

    /**
     * 解析租户状态值。
     *
     * @param isDisable 是否禁用
     * @return 数据库存储值
     */
    private Integer resolveStatus(Boolean isDisable) {
        if (Boolean.TRUE.equals(isDisable)) {
            return 0;
        }
        return 1;
    }

    /**
     * 格式化时间。
     *
     * @param value 时间值
     * @return 格式化后的时间
     */
    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
