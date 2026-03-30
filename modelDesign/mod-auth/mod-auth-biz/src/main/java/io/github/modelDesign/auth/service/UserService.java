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
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
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
     * 当前实现支持：
     * - 分页
     * - 按用户 ID 集合筛选
     * - 按昵称关键字筛选
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<UserListItemVo> getList(UserListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<Long> ids = request.getIds() == null
                ? Collections.emptyList()
                : request.getIds().stream().filter(Objects::nonNull).distinct().toList();
        String nickname = request.getNickname() == null ? null : request.getNickname().trim();
        List<User> allUsers = lambdaQuery()
                .in(!ids.isEmpty(), User::getId, ids)
                .like(StringUtils.hasText(nickname), User::getNickname, nickname)
                .orderByDesc(User::getUpdateTime)
                .list();
        long total = allUsers.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<User> pageUsers = allUsers.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(pageUsers.stream().map(this::toUserListItem).toList(), total);
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
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
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
        user.setStatus(Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1);
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
                .set(User::getStatus, Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1)
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
                .set(User::getStatus, Boolean.TRUE.equals(request.getIsDisable()) ? 0 : 1)
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
        String normalizedUsername = username == null ? null : username.trim();
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
        return UserListItemVo.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .username(user.getUsername())
                .avatarId(user.getAvatarId())
                .isDisable(!Objects.equals(user.getStatus(), 1))
                .build();
    }
}
