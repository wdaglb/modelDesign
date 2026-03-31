package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectMember;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import io.github.modelDesign.project.mapper.ProjectMemberMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import io.github.modelDesign.project.request.ProjectTaskMemberUpdateRequest;
import io.github.modelDesign.project.response.ProjectTaskMemberVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目任务成员服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskMemberService extends ServiceImpl<ProjectTaskMemberMapper, ProjectTaskMember> implements IService<ProjectTaskMember> {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 项目任务服务。
     */
    private final ProjectTaskService projectTaskService;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目成员 Mapper。
     */
    private final ProjectMemberMapper projectMemberMapper;

    /**
     * 获取任务成员列表。
     *
     * @param taskId 任务 ID
     * @return 任务成员列表
     */
    public List<ProjectTaskMemberVo> getList(Long taskId) {
        projectTaskService.requireTask(taskId);
        List<ProjectTaskMember> members = lambdaQuery()
                .eq(ProjectTaskMember::getTaskId, taskId)
                .orderByDesc(ProjectTaskMember::getCreateTime)
                .list();
        if (members.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> userIds = members.stream()
                .map(ProjectTaskMember::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(userIds);
        return members.stream()
                .map(member -> {
                    AuthUserSimpleDto user = userMap.get(member.getUserId());
                    String nickname = "";
                    if (user != null && user.getNickname() != null) {
                        nickname = user.getNickname();
                    }
                    String avatarId = "";
                    if (user != null && user.getAvatarId() != null) {
                        avatarId = user.getAvatarId();
                    }
                    return ProjectTaskMemberVo.builder()
                            .taskId(member.getTaskId())
                            .userId(member.getUserId())
                            .nickname(nickname)
                            .avatarId(avatarId)
                            .joinedAt(formatDateTime(member.getCreateTime()))
                            .build();
                })
                .toList();
    }

    /**
     * 添加任务成员。
     *
     * @param request 成员变更请求
     * @return 新增数量
     */
    public int add(ProjectTaskMemberUpdateRequest request) {
        ProjectTask task = projectTaskService.requireTask(request.getTaskId());
        List<Long> targetUserIds = request.getUserIds().stream().distinct().toList();
        validateProjectMembers(task.getProjectId(), targetUserIds);
        Set<Long> existedUserIds = lambdaQuery()
                .eq(ProjectTaskMember::getTaskId, request.getTaskId())
                .in(ProjectTaskMember::getUserId, targetUserIds)
                .list()
                .stream()
                .map(ProjectTaskMember::getUserId)
                .collect(Collectors.toSet());
        List<ProjectTaskMember> members = targetUserIds.stream()
                .filter(userId -> !existedUserIds.contains(userId))
                .map(userId -> {
                    ProjectTaskMember member = new ProjectTaskMember();
                    member.setTaskId(request.getTaskId());
                    member.setUserId(userId);
                    return member;
                })
                .toList();
        if (members.isEmpty()) {
            return 0;
        }
        saveBatch(members);
        return members.size();
    }

    /**
     * 删除任务成员。
     *
     * @param request 成员变更请求
     * @return 删除数量
     */
    public int delete(ProjectTaskMemberUpdateRequest request) {
        ProjectTask task = projectTaskService.requireTask(request.getTaskId());
        if (task.getAssigneeId() != null && request.getUserIds().contains(task.getAssigneeId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前负责人不能直接移除，请先变更负责人");
        }
        List<ProjectTaskMember> members = lambdaQuery()
                .eq(ProjectTaskMember::getTaskId, request.getTaskId())
                .in(ProjectTaskMember::getUserId, request.getUserIds())
                .list();
        if (members.isEmpty()) {
            return 0;
        }
        List<Long> ids = members.stream().map(ProjectTaskMember::getId).toList();
        removeByIds(ids);
        return ids.size();
    }

    private void validateProjectMembers(Long projectId, List<Long> userIds) {
        Set<Long> projectMemberUserIds = projectMemberMapper.selectList(new LambdaQueryWrapper<ProjectMember>()
                        .eq(ProjectMember::getProjectId, projectId)
                        .in(ProjectMember::getUserId, userIds))
                .stream()
                .map(ProjectMember::getUserId)
                .collect(Collectors.toSet());
        boolean hasInvalidUser = userIds.stream().anyMatch(userId -> !projectMemberUserIds.contains(userId));
        if (hasInvalidUser) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在未加入项目的用户，不能添加为任务成员");
        }
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
