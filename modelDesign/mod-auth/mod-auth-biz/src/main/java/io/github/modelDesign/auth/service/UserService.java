package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.mapper.UserMapper;
import io.github.modelDesign.auth.request.UserAddRequest;
import io.github.modelDesign.auth.request.UserBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.UserListRequest;
import io.github.modelDesign.auth.request.UserUpdateRequest;
import io.github.modelDesign.auth.request.UserUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.UserListItemVo;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 后台管理员服务。
 *
 * 负责用户管理页面对应的核心业务：列表查询、新增、编辑、
 * 单个状态切换以及批量状态切换。
 */
@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> implements IService<User> {
    /**
     * 密码编码器。
     */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 租户服务。
     */
    private final TenantService tenantService;

    /**
     * 用户列表查询上下文工厂。
     */
    private final UserListQueryContextFactory userListQueryContextFactory;

    /**
     * 用户列表视图组装器。
     */
    private final UserListViewAssembler userListViewAssembler;

    /**
     * 按用户名查询管理员。
     *
     * 主要用于登录校验等场景。
     *
     * @param username 用户名
     * @return 管理员信息
     */
    public User getByUsername(String username) {
        return lambdaQuery()
                .eq(User::getUsername, username)
                .last("limit 1")
                .one();
    }

    /**
     * 获取用户列表。
     *
     * 当前实现支持统一搜索、高级筛选与摘要状态过滤。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<UserListItemVo> getList(UserListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<Long> ids = normalizeIds(request.getIds());
        UserListQueryContext context = userListQueryContextFactory.create(request);
        if (context == null) {
            context = new UserListQueryContext();
        }
        Integer status = resolveStatusFilter(context.getIsDisable());
        final UserListQueryContext finalContext = context;
        final Integer finalStatus = status;
        List<User> allUsers = lambdaQuery()
                .in(!ids.isEmpty(), User::getId, ids)
                .eq(
                        finalContext.getUserId() != null,
                        User::getId,
                        finalContext.getUserId()
                )
                .eq(
                        finalContext.getKeywordUserId() != null,
                        User::getId,
                        finalContext.getKeywordUserId()
                )
                .like(
                        StringUtils.hasText(finalContext.getUsername()),
                        User::getUsername,
                        finalContext.getUsername()
                )
                .like(
                        StringUtils.hasText(finalContext.getNickname()),
                        User::getNickname,
                        finalContext.getNickname()
                )
                .and(
                        finalContext.hasKeywordText(),
                        wrapper -> wrapper.like(
                                        User::getUsername,
                                        finalContext.getKeywordText()
                                )
                                .or()
                                .like(User::getNickname, finalContext.getKeywordText())
                )
                .eq(
                        finalContext.getTenantId() != null,
                        User::getTenantId,
                        finalContext.getTenantId()
                )
                .eq(finalStatus != null, User::getStatus, finalStatus)
                .orderByDesc(User::getUpdateTime)
                .list();
        List<UserListItemVo> allItems = userListViewAssembler.assemble(allUsers)
                .stream()
                .filter(item -> matchesRoleFilter(item, finalContext.getHasRole()))
                .filter(item -> matchesPositionFilter(item, finalContext.getHasPosition()))
                .toList();
        long total = allItems.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<UserListItemVo> pageItems = allItems.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(pageItems, total);
    }

    /**
     * 新增用户。
     *
     * 创建时会校验用户名唯一性，并将前端传入的密码摘要再次做 BCrypt 编码后入库。
     * 状态字段统一转成数据库中的 `status` 值：1 为启用，0 为禁用。
     *
     * @param request 新增请求
     * @return 用户列表项
     */
    public UserListItemVo add(UserAddRequest request) {
        validateUsername(request.getUsername(), null);
        User user = new User();
        user.setNickname(request.getNickname().trim());
        user.setUsername(request.getUsername().trim());
        user.setTenantId(resolveTenantIdForCreate(request.getTenantId()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(resolveStatus(request.getIsDisable()));
        save(user);
        return toUserListItem(user);
    }

    /**
     * 编辑用户。
     *
     * 当编辑请求中的密码为空时，仅更新昵称、用户名和状态，不修改原密码。
     *
     * @param id      用户 ID
     * @param request 编辑请求
     * @return 用户列表项
     */
    public UserListItemVo update(Long id, UserUpdateRequest request) {
        User user = requireUser(id);
        validateUsername(request.getUsername(), id);
        user.setNickname(request.getNickname().trim());
        user.setUsername(request.getUsername().trim());
        user.setTenantId(resolveTenantIdForUpdate(request.getTenantId(), user.getTenantId()));
        user.setStatus(resolveStatus(request.getIsDisable()));
        if (StringUtils.hasText(request.getPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        updateById(user);
        return toUserListItem(user);
    }

    /**
     * 修改单个用户状态。
     *
     * 用于列表页中的单条启用/禁用操作。
     *
     * @param request 状态请求
     */
    public void updateStatus(UserUpdateStatusRequest request) {
        requireUser(request.getId());
        lambdaUpdate()
                .eq(User::getId, request.getId())
                .set(User::getStatus, resolveStatus(request.getIsDisable()))
                .update();
    }

    /**
     * 批量修改用户状态。
     *
     * 当前仅支持统一将多名用户批量启用或批量禁用。
     *
     * @param request 批量状态请求
     */
    public void batchUpdateStatus(UserBatchUpdateStatusRequest request) {
        List<Long> ids = request.getIds().stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户 ID 不能为空");
        }
        lambdaUpdate()
                .in(User::getId, ids)
                .set(User::getStatus, resolveStatus(request.getIsDisable()))
                .update();
    }

    /**
     * 获取用户，不存在则抛异常。
     *
     * @param id 用户 ID
     * @return 用户实体
     */
    public User requireUser(Long id) {
        User user = getById(id);
        if (user == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "用户不存在");
        }
        return user;
    }

    /**
     * 校验用户名唯一性。
     *
     * 编辑场景下会排除当前用户自身，避免“用户名未改动”时误报重复。
     *
     * @param username  用户名
     * @param currentId 当前用户 ID，可为空
     */
    private void validateUsername(String username, Long currentId) {
        String normalizedUsername = null;
        if (username != null) {
            normalizedUsername = username.trim();
        }
        if (!StringUtils.hasText(normalizedUsername)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户名不能为空");
        }
        boolean exists = lambdaQuery()
                .eq(User::getUsername, normalizedUsername)
                .ne(currentId != null, User::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户名已存在");
        }
    }

    /**
     * 将用户实体转换为列表项。
     *
     * 这里统一负责把数据库中的 `status` 转为前端需要的 `isDisable`。
     *
     * @param user 用户实体
     * @return 用户列表项
     */
    private UserListItemVo toUserListItem(User user) {
        return toUserListItem(user, Collections.emptyMap());
    }

    /**
     * 将用户实体转换为列表项。
     *
     * @param user 用户实体
     * @param tenantNameMap 租户名称映射
     * @return 用户列表项
     */
    private UserListItemVo toUserListItem(User user, Map<Long, String> tenantNameMap) {
        String tenantName = "";
        if (user.getTenantId() != null) {
            String mappedName = tenantNameMap.get(user.getTenantId());
            if (mappedName != null) {
                tenantName = mappedName;
            }
        }
        return UserListItemVo.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .username(user.getUsername())
                .tenantId(user.getTenantId())
                .tenantName(tenantName)
                .avatarId(user.getAvatarId())
                .isDisable(resolveDisable(user.getStatus()))
                .build();
    }

    /**
     * 规范化用户 ID 列表。
     *
     * @param ids 原始用户 ID 列表
     * @return 去重后的用户 ID 列表
     */
    private List<Long> normalizeIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return ids.stream().filter(Objects::nonNull).distinct().toList();
    }

    /**
     * 解析列表状态筛选值。
     *
     * @param isDisable 是否禁用
     * @return 数据库存储状态
     */
    private Integer resolveStatusFilter(Boolean isDisable) {
        if (isDisable == null) {
            return null;
        }
        if (Boolean.TRUE.equals(isDisable)) {
            return 0;
        }
        return 1;
    }

    /**
     * 判断当前列表项是否满足角色绑定筛选。
     *
     * @param item 列表项
     * @param hasRole 筛选值
     * @return 是否命中
     */
    private boolean matchesRoleFilter(UserListItemVo item, Boolean hasRole) {
        if (hasRole == null) {
            return true;
        }
        return Objects.equals(hasRole, item.getHasRole());
    }

    /**
     * 判断当前列表项是否满足职位绑定筛选。
     *
     * @param item 列表项
     * @param hasPosition 筛选值
     * @return 是否命中
     */
    private boolean matchesPositionFilter(UserListItemVo item, Boolean hasPosition) {
        if (hasPosition == null) {
            return true;
        }
        return Objects.equals(hasPosition, item.getHasPosition());
    }

    /**
     * 解析新增场景下的租户 ID。
     *
     * @param requestTenantId 请求中的租户 ID
     * @return 最终租户 ID
     */
    private Long resolveTenantIdForCreate(Long requestTenantId) {
        Long targetTenantId = requestTenantId;
        if (targetTenantId != null) {
            return tenantService.requireAssignableTenantId(targetTenantId);
        }
        targetTenantId = getCurrentTenantId();
        if (targetTenantId != null) {
            return tenantService.requireAssignableTenantId(targetTenantId);
        }
        targetTenantId = TenantService.DEFAULT_TENANT_ID;
        return tenantService.requireAssignableTenantId(targetTenantId);
    }

    /**
     * 解析编辑场景下的租户 ID。
     *
     * @param requestTenantId  请求中的租户 ID
     * @param existingTenantId 当前用户已有租户 ID
     * @return 最终租户 ID
     */
    private Long resolveTenantIdForUpdate(Long requestTenantId, Long existingTenantId) {
        Long targetTenantId = requestTenantId;
        if (targetTenantId != null) {
            return tenantService.requireAssignableTenantId(targetTenantId);
        }
        targetTenantId = existingTenantId;
        if (targetTenantId != null) {
            return tenantService.requireAssignableTenantId(targetTenantId);
        }
        targetTenantId = getCurrentTenantId();
        if (targetTenantId != null) {
            return tenantService.requireAssignableTenantId(targetTenantId);
        }
        targetTenantId = TenantService.DEFAULT_TENANT_ID;
        return tenantService.requireAssignableTenantId(targetTenantId);
    }

    /**
     * 解析用户状态值。
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
     * 解析列表中的禁用状态。
     *
     * @param status 数据库存储状态
     * @return 是否禁用
     */
    private Boolean resolveDisable(Integer status) {
        if (Objects.equals(status, 1)) {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前租户 ID
     */
    private Long getCurrentTenantId() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            return null;
        }
        return currentAdmin.getTenantId();
    }
}
