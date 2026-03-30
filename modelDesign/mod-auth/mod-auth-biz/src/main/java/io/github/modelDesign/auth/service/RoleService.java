package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.Role;
import io.github.modelDesign.auth.mapper.RoleMapper;
import io.github.modelDesign.auth.request.RoleAddRequest;
import io.github.modelDesign.auth.request.RoleBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.RoleListRequest;
import io.github.modelDesign.auth.request.RoleUpdateRequest;
import io.github.modelDesign.auth.request.RoleUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.RoleListItemVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * 角色管理服务。
 *
 * 负责角色管理页面对应的核心业务：列表查询、新增、编辑、
 * 单个状态切换以及批量状态切换。
 */
@Service
public class RoleService extends ServiceImpl<RoleMapper, Role> implements IService<Role> {
    /**
     * 获取角色列表。
     *
     * 当前实现支持：
     * - 分页
     * - 按角色 ID 集合筛选
     * - 按角色名称关键字筛选
     * - 按角色编码关键字筛选
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<RoleListItemVo> getList(RoleListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<Long> ids = request.getIds() == null
                ? Collections.emptyList()
                : request.getIds().stream().filter(Objects::nonNull).distinct().toList();
        String name = request.getName() == null ? null : request.getName().trim();
        String code = request.getCode() == null ? null : request.getCode().trim();
        List<Role> allRoles = lambdaQuery()
                .in(!ids.isEmpty(), Role::getId, ids)
                .like(StringUtils.hasText(name), Role::getName, name)
                .like(StringUtils.hasText(code), Role::getCode, code)
                .orderByAsc(Role::getSort)
                .orderByDesc(Role::getUpdateTime)
                .list();
        long total = allRoles.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<Role> pageRoles = allRoles.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(pageRoles.stream().map(this::toRoleListItem).toList(), total);
    }

    /**
     * 新增角色。
     *
     * 创建时会校验角色编码唯一性，并将页面状态字段统一转成数据库中的 `status` 值。
     *
     * @param request 新增请求
     * @return 角色列表项
     */
    public RoleListItemVo add(RoleAddRequest request) {
        validateCode(request.getCode(), null);
        Role role = new Role();
        role.setName(request.getName().trim());
        role.setCode(request.getCode().trim());
        role.setRemark(normalizeRemark(request.getRemark()));
        role.setSort(request.getSort() == null ? 0 : request.getSort());
        role.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
        save(role);
        return toRoleListItem(role);
    }

    /**
     * 编辑角色。
     *
     * 会排除当前角色自身做编码唯一性校验，避免编码未修改时误报重复。
     *
     * @param id      角色 ID
     * @param request 编辑请求
     * @return 角色列表项
     */
    public RoleListItemVo update(Long id, RoleUpdateRequest request) {
        Role role = requireRole(id);
        validateCode(request.getCode(), id);
        role.setName(request.getName().trim());
        role.setCode(request.getCode().trim());
        role.setRemark(normalizeRemark(request.getRemark()));
        role.setSort(request.getSort() == null ? 0 : request.getSort());
        role.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
        updateById(role);
        return toRoleListItem(role);
    }

    /**
     * 修改单个角色状态。
     *
     * 用于列表页中的单条启用/禁用操作。
     *
     * @param request 状态请求
     */
    public void updateStatus(RoleUpdateStatusRequest request) {
        requireRole(request.getId());
        lambdaUpdate()
                .eq(Role::getId, request.getId())
                .set(Role::getStatus, Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1)
                .update();
    }

    /**
     * 批量修改角色状态。
     *
     * 当前仅支持统一将多条角色记录批量启用或批量禁用。
     *
     * @param request 批量状态请求
     */
    public void batchUpdateStatus(RoleBatchUpdateStatusRequest request) {
        List<Long> ids = request.getIds().stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "角色 ID 不能为空");
        }
        lambdaUpdate()
                .in(Role::getId, ids)
                .set(Role::getStatus, Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1)
                .update();
    }

    /**
     * 获取角色，不存在则抛异常。
     *
     * @param id 角色 ID
     * @return 角色实体
     */
    public Role requireRole(Long id) {
        Role role = getById(id);
        if (role == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "角色不存在");
        }
        return role;
    }

    /**
     * 按角色编码获取角色，不存在则抛异常。
     *
     * @param code 角色编码
     * @return 角色实体
     */
    public Role requireRoleByCode(String code) {
        Role role = lambdaQuery()
                .eq(Role::getCode, code)
                .last("limit 1")
                .one();
        if (role == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "角色不存在");
        }
        return role;
    }

    /**
     * 校验角色编码唯一性。
     *
     * @param code      角色编码
     * @param currentId 当前角色 ID，可为空
     */
    private void validateCode(String code, Long currentId) {
        String normalizedCode = code == null ? null : code.trim();
        if (!StringUtils.hasText(normalizedCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "角色编码不能为空");
        }
        boolean exists = lambdaQuery()
                .eq(Role::getCode, normalizedCode)
                .ne(currentId != null, Role::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "角色编码已存在");
        }
    }

    /**
     * 统一整理备注值。
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
     * 将角色实体转换为列表项。
     *
     * @param role 角色实体
     * @return 角色列表项
     */
    private RoleListItemVo toRoleListItem(Role role) {
        return RoleListItemVo.builder()
                .id(role.getId())
                .name(role.getName())
                .code(role.getCode())
                .remark(role.getRemark())
                .sort(role.getSort())
                .isDisable(!Objects.equals(role.getStatus(), 1))
                .build();
    }
}
