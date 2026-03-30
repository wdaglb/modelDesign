package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.ProjectMember;
import io.github.modelDesign.project.mapper.ProjectMemberMapper;
import io.github.modelDesign.project.request.ProjectMemberUpdateRequest;
import io.github.modelDesign.project.response.ProjectMemberVo;
import lombok.RequiredArgsConstructor;
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
 * 项目成员服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectMemberService extends ServiceImpl<ProjectMemberMapper, ProjectMember> implements IService<ProjectMember> {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 获取项目成员列表。
     *
     * @param projectId 项目 ID
     * @return 项目成员列表
     */
    public List<ProjectMemberVo> getList(Long projectId) {
        projectService.requireProject(projectId);
        List<ProjectMember> members = lambdaQuery()
                .eq(ProjectMember::getProjectId, projectId)
                .orderByDesc(ProjectMember::getCreateTime)
                .list();
        if (members.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> userIds = members.stream()
                .map(ProjectMember::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(userIds);
        return members.stream()
                .map(member -> {
                    AuthUserSimpleDto user = userMap.get(member.getUserId());
                    return ProjectMemberVo.builder()
                            .projectId(member.getProjectId())
                            .userId(member.getUserId())
                            .nickname(user == null || user.getNickname() == null ? "" : user.getNickname())
                            .avatarId(user == null || user.getAvatarId() == null ? "" : user.getAvatarId())
                            .joinedAt(formatDateTime(member.getCreateTime()))
                            .build();
                })
                .toList();
    }

    /**
     * 添加项目成员。
     *
     * @param request 成员变更请求
     * @return 新增数量
     */
    public int add(ProjectMemberUpdateRequest request) {
        projectService.requireProject(request.getProjectId());
        List<Long> targetUserIds = request.getUserIds().stream().distinct().toList();
        Set<Long> existedUserIds = lambdaQuery()
                .eq(ProjectMember::getProjectId, request.getProjectId())
                .in(ProjectMember::getUserId, targetUserIds)
                .list()
                .stream()
                .map(ProjectMember::getUserId)
                .collect(Collectors.toSet());
        List<ProjectMember> members = targetUserIds.stream()
                .filter(userId -> !existedUserIds.contains(userId))
                .map(userId -> {
                    ProjectMember member = new ProjectMember();
                    member.setProjectId(request.getProjectId());
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
     * 删除项目成员。
     *
     * @param request 成员变更请求
     * @return 删除数量
     */
    public int delete(ProjectMemberUpdateRequest request) {
        projectService.requireProject(request.getProjectId());
        List<ProjectMember> members = lambdaQuery()
                .eq(ProjectMember::getProjectId, request.getProjectId())
                .in(ProjectMember::getUserId, request.getUserIds())
                .list();
        if (members.isEmpty()) {
            return 0;
        }
        List<Long> ids = members.stream().map(ProjectMember::getId).toList();
        removeByIds(ids);
        return ids.size();
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME_FORMATTER.format(value);
    }
}
