package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.Position;
import io.github.modelDesign.auth.mapper.PositionMapper;
import io.github.modelDesign.auth.request.PositionAddRequest;
import io.github.modelDesign.auth.request.PositionBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.PositionDeleteRequest;
import io.github.modelDesign.auth.request.PositionListRequest;
import io.github.modelDesign.auth.request.PositionUpdateRequest;
import io.github.modelDesign.auth.request.PositionUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.PositionListItemVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 职位服务。
 */
@Service
public class PositionService extends ServiceImpl<PositionMapper, Position> implements IService<Position> {
    /**
     * 租户服务。
     */
    private final TenantService tenantService;

    /**
     * 用户职位关系服务。
     */
    private final UserPositionService userPositionService;

    /**
     * 当前登录上下文访问器。
     */
    private final CurrentAdminAccessor currentAdminAccessor;

    /**
     * 运行时依赖构造函数。
     *
     * @param tenantService 租户服务
     * @param userPositionService 用户职位关系服务
     * @param currentAdminAccessor 当前登录上下文访问器
     */
    @Autowired
    public PositionService(TenantService tenantService,
                           UserPositionService userPositionService,
                           CurrentAdminAccessor currentAdminAccessor) {
        this.tenantService = tenantService;
        this.userPositionService = userPositionService;
        this.currentAdminAccessor = currentAdminAccessor;
    }

    /**
     * 供测试替身复用的精简构造函数。
     *
     * @param tenantService 租户服务
     * @param userPositionService 用户职位关系服务
     */
    protected PositionService(TenantService tenantService, UserPositionService userPositionService) {
        this.tenantService = tenantService;
        this.userPositionService = userPositionService;
        this.currentAdminAccessor = null;
    }

    /**
     * 获取职位列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<PositionListItemVo> getList(PositionListRequest request) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String name = normalizeKeyword(request.getName());
        String code = normalizeKeyword(request.getCode());
        Integer status = null;
        if (request.getIsDisable() != null) {
            status = resolveStatus(request.getIsDisable());
        }

        List<Position> allPositions = lambdaQuery()
                .eq(Position::getTenantId, currentTenantId)
                .like(StringUtils.hasText(name), Position::getName, name)
                .like(StringUtils.hasText(code), Position::getCode, code)
                .eq(status != null, Position::getStatus, status)
                .orderByAsc(Position::getSort)
                .orderByDesc(Position::getUpdateTime)
                .list();

        long total = allPositions.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<Position> pagePositions = allPositions.subList((int) fromIndex, (int) toIndex);

        Set<Long> tenantIds = new LinkedHashSet<>();
        for (Position position : pagePositions) {
            if (position.getTenantId() != null) {
                tenantIds.add(position.getTenantId());
            }
        }
        Map<Long, String> tenantNameMap = tenantService.getDisplayNameMapByIds(tenantIds);

        List<PositionListItemVo> items = new ArrayList<>();
        for (Position position : pagePositions) {
            items.add(toPositionListItem(position, tenantNameMap));
        }
        return new PageResponse<>(items, total);
    }

    /**
     * 批量获取职位名称映射。
     *
     * @param positionIds 职位 ID 集合
     * @return 职位 ID 到名称的映射
     */
    public Map<Long, String> getNameMapByIds(Collection<Long> positionIds) {
        if (positionIds == null || positionIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> distinctIds = new LinkedHashSet<>();
        for (Long positionId : positionIds) {
            if (positionId != null) {
                distinctIds.add(positionId);
            }
        }
        if (distinctIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Position> positions = getBaseMapper().selectBatchIds(distinctIds);
        Map<Long, String> positionNameMap = new LinkedHashMap<>();
        for (Position position : positions) {
            positionNameMap.put(position.getId(), position.getName());
        }
        for (Long positionId : distinctIds) {
            if (!positionNameMap.containsKey(positionId)) {
                positionNameMap.put(positionId, "职位已删除");
            }
        }
        return positionNameMap;
    }

    /**
     * 新增职位。
     *
     * @param request 新增请求
     * @return 职位列表项
     */
    public PositionListItemVo add(PositionAddRequest request) {
        Long tenantId = resolveTenantId(request.getTenantId());
        validateCode(tenantId, request.getCode(), null);

        Position position = new Position();
        fillPosition(position, tenantId, request.getName(), request.getCode(), request.getRemark(), request.getSort(), request.getIsDisable());
        save(position);
        return toPositionListItem(position);
    }

    /**
     * 编辑职位。
     *
     * @param id 职位 ID
     * @param request 编辑请求
     * @return 职位列表项
     */
    public PositionListItemVo update(Long id, PositionUpdateRequest request) {
        Position position = requirePosition(id);
        Long tenantId = resolveTenantId(request.getTenantId());
        validateTenantChanging(position, tenantId);
        validateCode(tenantId, request.getCode(), id);

        fillPosition(position, tenantId, request.getName(), request.getCode(), request.getRemark(), request.getSort(), request.getIsDisable());
        updateById(position);
        return toPositionListItem(position);
    }

    /**
     * 修改单个职位状态。
     *
     * @param request 状态请求
     */
    public void updateStatus(PositionUpdateStatusRequest request) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        requirePosition(request.getId());
        lambdaUpdate()
                .eq(Position::getId, request.getId())
                .eq(Position::getTenantId, currentTenantId)
                .set(Position::getStatus, resolveStatus(request.getIsDisable()))
                .update();
    }

    /**
     * 批量修改职位状态。
     *
     * @param request 批量状态请求
     */
    public void batchUpdateStatus(PositionBatchUpdateStatusRequest request) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        List<Long> ids = normalizeIds(request.getIds());
        if (ids.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "职位 ID 不能为空");
        }
        lambdaUpdate()
                .eq(Position::getTenantId, currentTenantId)
                .in(Position::getId, ids)
                .set(Position::getStatus, resolveStatus(request.getIsDisable()))
                .update();
    }

    /**
     * 删除职位。
     *
     * @param request 删除请求
     */
    @Transactional
    public void delete(PositionDeleteRequest request) {
        Position position = requirePosition(request.getId());
        userPositionService.removeByPositionId(position.getId());
        removeById(position.getId());
    }

    /**
     * 获取职位，不存在则抛异常。
     *
     * @param id 职位 ID
     * @return 职位实体
     */
    public Position requirePosition(Long id) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        Position position = lambdaQuery()
                .eq(Position::getId, id)
                .eq(Position::getTenantId, currentTenantId)
                .last("limit 1")
                .one();
        if (position == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "职位不存在");
        }
        return position;
    }

    /**
     * 解析当前请求允许操作的租户 ID。
     *
     * 当前职位管理已经收敛为“只允许操作当前登录租户下的数据”，
     * 因此前端即使传入其它租户 ID，后端也会直接拒绝。
     *
     * @param requestTenantId 请求中的租户 ID
     * @return 当前租户 ID
     */
    private Long resolveTenantId(Long requestTenantId) {
        Long currentTenantId = currentAdminAccessor.requireCurrentTenantId();
        if (requestTenantId != null && !currentTenantId.equals(requestTenantId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN.value(), "只能操作当前租户下的职位");
        }
        return tenantService.requireAssignableTenantId(currentTenantId);
    }

    /**
     * 校验职位所属租户修改是否合法。
     *
     * @param position 原职位
     * @param tenantId 新租户 ID
     */
    private void validateTenantChanging(Position position, Long tenantId) {
        if (Objects.equals(position.getTenantId(), tenantId)) {
            return;
        }
        long bindCount = userPositionService.countByPositionId(position.getId());
        if (bindCount > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "职位已绑定用户，不能修改所属租户");
        }
    }

    /**
     * 填充职位字段。
     *
     * @param position 职位实体
     * @param tenantId 所属租户 ID
     * @param name 职位名称
     * @param code 职位编码
     * @param remark 备注
     * @param sort 排序值
     * @param isDisable 是否禁用
     */
    private void fillPosition(Position position, Long tenantId, String name, String code, String remark, Integer sort, Boolean isDisable) {
        position.setTenantId(tenantId);
        position.setName(normalizeRequiredValue(name, "职位名称不能为空"));
        position.setCode(normalizeRequiredValue(code, "职位编码不能为空"));
        position.setRemark(normalizeRemark(remark));
        if (sort == null) {
            position.setSort(0);
        } else {
            position.setSort(sort);
        }
        position.setStatus(resolveStatus(isDisable));
    }

    /**
     * 校验职位编码唯一性。
     *
     * @param tenantId 所属租户 ID
     * @param code 职位编码
     * @param currentId 当前职位 ID
     */
    private void validateCode(Long tenantId, String code, Long currentId) {
        String normalizedCode = normalizeRequiredValue(code, "职位编码不能为空");
        boolean exists = lambdaQuery()
                .eq(Position::getTenantId, tenantId)
                .eq(Position::getCode, normalizedCode)
                .ne(currentId != null, Position::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "该租户下职位编码已存在");
        }
    }

    /**
     * 将职位转换为列表项。
     *
     * @param position 职位实体
     * @return 列表项
     */
    private PositionListItemVo toPositionListItem(Position position) {
        Map<Long, String> tenantNameMap = Collections.emptyMap();
        if (position.getTenantId() != null) {
            tenantNameMap = tenantService.getDisplayNameMapByIds(List.of(position.getTenantId()));
        }
        return toPositionListItem(position, tenantNameMap);
    }

    /**
     * 将职位转换为列表项。
     *
     * @param position 职位实体
     * @param tenantNameMap 租户名称映射
     * @return 列表项
     */
    private PositionListItemVo toPositionListItem(Position position, Map<Long, String> tenantNameMap) {
        String tenantName = "";
        if (position.getTenantId() != null) {
            String mappedName = tenantNameMap.get(position.getTenantId());
            if (mappedName != null) {
                tenantName = mappedName;
            }
        }
        boolean isDisable = true;
        if (Objects.equals(position.getStatus(), 1)) {
            isDisable = false;
        }
        return PositionListItemVo.builder()
                .id(position.getId())
                .tenantId(position.getTenantId())
                .tenantName(tenantName)
                .name(position.getName())
                .code(position.getCode())
                .remark(position.getRemark())
                .sort(position.getSort())
                .isDisable(isDisable)
                .build();
    }

    /**
     * 规范化关键字。
     *
     * @param keyword 原始关键字
     * @return 去空格后的关键字
     */
    private String normalizeKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return keyword.trim();
    }

    /**
     * 规范化必填值。
     *
     * @param value 原始值
     * @param message 异常信息
     * @return 规范化后的值
     */
    private String normalizeRequiredValue(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), message);
        }
        return value.trim();
    }

    /**
     * 规范化备注。
     *
     * @param remark 原始备注
     * @return 规范化后的备注
     */
    private String normalizeRemark(String remark) {
        if (!StringUtils.hasText(remark)) {
            return "";
        }
        return remark.trim();
    }

    /**
     * 解析状态值。
     *
     * @param isDisable 是否禁用
     * @return 数据库存储状态
     */
    private Integer resolveStatus(Boolean isDisable) {
        if (Boolean.TRUE.equals(isDisable)) {
            return 0;
        }
        return 1;
    }

    /**
     * 规范化 ID 列表。
     *
     * @param ids 原始 ID 列表
     * @return 去重后的 ID 列表
     */
    private List<Long> normalizeIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        Set<Long> distinctIds = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id != null) {
                distinctIds.add(id);
            }
        }
        return new ArrayList<>(distinctIds);
    }
}
