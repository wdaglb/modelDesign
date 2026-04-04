package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.Position;
import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.domain.UserPosition;
import io.github.modelDesign.auth.mapper.PositionMapper;
import io.github.modelDesign.auth.mapper.UserMapper;
import io.github.modelDesign.auth.mapper.UserPositionMapper;
import io.github.modelDesign.auth.request.UserPositionUpdateRequest;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 用户职位关系服务。
 */
@Service
@RequiredArgsConstructor
public class UserPositionService extends ServiceImpl<UserPositionMapper, UserPosition> implements IService<UserPosition> {
    /**
     * 用户 Mapper。
     */
    private final UserMapper userMapper;

    /**
     * 职位 Mapper。
     */
    private final PositionMapper positionMapper;

    /**
     * 获取用户已绑定职位 ID 列表。
     *
     * @param userId 用户 ID
     * @return 职位 ID 列表
     */
    public List<Long> getUserPositionIds(Long userId) {
        requireUser(userId);
        return lambdaQuery()
                .eq(UserPosition::getUserId, userId)
                .orderByAsc(UserPosition::getId)
                .list()
                .stream()
                .map(UserPosition::getPositionId)
                .toList();
    }

    /**
     * 批量获取用户已绑定的职位 ID 列表。
     *
     * @param userIds 用户 ID 集合
     * @return 用户 ID 到职位 ID 列表的映射
     */
    public Map<Long, List<Long>> getUserPositionIdsMap(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        Set<Long> distinctUserIds = new LinkedHashSet<>();
        for (Long userId : userIds) {
            if (userId != null) {
                distinctUserIds.add(userId);
            }
        }
        if (distinctUserIds.isEmpty()) {
            return Map.of();
        }

        List<UserPosition> relations = lambdaQuery()
                .in(UserPosition::getUserId, distinctUserIds)
                .orderByAsc(UserPosition::getId)
                .list();

        Map<Long, List<Long>> result = new LinkedHashMap<>();
        for (Long userId : distinctUserIds) {
            result.put(userId, new ArrayList<>());
        }
        for (UserPosition relation : relations) {
            if (relation == null) {
                continue;
            }
            Long userId = relation.getUserId();
            if (userId == null) {
                continue;
            }
            List<Long> positionIds = result.get(userId);
            if (positionIds == null) {
                positionIds = new ArrayList<>();
                result.put(userId, positionIds);
            }
            if (relation.getPositionId() != null) {
                positionIds.add(relation.getPositionId());
            }
        }
        return result;
    }

    /**
     * 统计职位绑定人数。
     *
     * @param positionId 职位 ID
     * @return 绑定数量
     */
    public long countByPositionId(Long positionId) {
        return lambdaQuery()
                .eq(UserPosition::getPositionId, positionId)
                .count();
    }

    /**
     * 删除某个职位下的全部绑定关系。
     *
     * @param positionId 职位 ID
     */
    public void removeByPositionId(Long positionId) {
        lambdaUpdate()
                .eq(UserPosition::getPositionId, positionId)
                .remove();
    }

    /**
     * 覆盖式更新用户绑定职位。
     *
     * @param userId 用户 ID
     * @param request 职位绑定请求
     */
    @Transactional
    public void updateUserPositions(Long userId, UserPositionUpdateRequest request) {
        User user = requireUser(userId);
        if (user.getTenantId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "用户未绑定租户，不能绑定职位");
        }

        List<Long> positionIds = normalizePositionIds(request);
        List<Long> existingPositionIds = getUserPositionIds(userId);
        Set<Long> existingPositionIdSet = new LinkedHashSet<>(existingPositionIds);

        if (positionIds.isEmpty()) {
            lambdaUpdate()
                    .eq(UserPosition::getUserId, userId)
                    .remove();
            return;
        }

        List<Position> positions = positionMapper.selectBatchIds(positionIds);
        if (positions.size() != positionIds.size()) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "职位不存在");
        }

        for (Position position : positions) {
            if (!Objects.equals(position.getTenantId(), user.getTenantId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "只能绑定同租户职位");
            }
            if (!Objects.equals(position.getStatus(), 1)) {
                if (!existingPositionIdSet.contains(position.getId())) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "禁用职位不能绑定");
                }
            }
        }

        lambdaUpdate()
                .eq(UserPosition::getUserId, userId)
                .remove();

        List<UserPosition> relations = new ArrayList<>();
        for (Long positionId : positionIds) {
            UserPosition relation = new UserPosition();
            relation.setUserId(userId);
            relation.setPositionId(positionId);
            relations.add(relation);
        }
        saveBatch(relations);
    }

    /**
     * 规范化职位 ID 列表。
     *
     * @param request 原始请求
     * @return 去重后的职位 ID 列表
     */
    private List<Long> normalizePositionIds(UserPositionUpdateRequest request) {
        if (request == null || request.getPositionIds() == null || request.getPositionIds().isEmpty()) {
            return List.of();
        }
        Set<Long> positionIds = new LinkedHashSet<>();
        for (Long positionId : request.getPositionIds()) {
            if (positionId != null) {
                positionIds.add(positionId);
            }
        }
        return new ArrayList<>(positionIds);
    }

    /**
     * 校验用户存在，不存在则抛出与原先一致的异常。
     *
     * @param userId 用户 ID
     * @return 用户实体
     */
    private User requireUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "用户不存在");
        }
        return user;
    }
}
