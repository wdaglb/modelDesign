package io.github.modelDesign.auth.api;

import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户查询接口实现。
 */
@Service
@RequiredArgsConstructor
public class AuthUserApiImpl implements AuthUserApi {
    /**
     * 用户服务。
     */
    private final UserService userService;

    /**
     * 按用户 ID 集合获取用户映射。
     *
     * @param userIds 用户 ID 集合
     * @return 用户映射
     */
    @Override
    public Map<Long, AuthUserSimpleDto> getUserMapByIds(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> targetUserIds = userIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (targetUserIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return userService.lambdaQuery()
                .in(User::getId, targetUserIds)
                .list()
                .stream()
                .map(user -> AuthUserSimpleDto.builder()
                        .id(user.getId())
                        .nickname(user.getNickname())
                        .avatarId(user.getAvatarId())
                        .build())
                .collect(Collectors.toMap(AuthUserSimpleDto::getId, user -> user, (left, right) -> left));
    }
}
