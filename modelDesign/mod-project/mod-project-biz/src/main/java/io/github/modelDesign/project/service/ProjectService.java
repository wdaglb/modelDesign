package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.request.ProjectCreateRequest;
import io.github.modelDesign.project.request.ProjectEditRequest;
import io.github.modelDesign.project.request.ProjectListRequest;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectService extends ServiceImpl<ProjectMapper, Project> implements IService<Project> {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 获取项目列表。
     *
     * @param request 列表请求
     * @return 分页项目列表
     */
    public PageResponse<ProjectDetailVo> getList(ProjectListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<Project> allProjects = lambdaQuery()
                .eq(Project::getDeleted, 0)
                .like(StringUtils.hasText(request.getName()), Project::getName, request.getName() == null ? null : request.getName().trim())
                .orderByDesc(Project::getUpdateTime)
                .list();
        long total = allProjects.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<Project> pageProjects = allProjects.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(toProjectVoList(pageProjects), total);
    }

    /**
     * 获取项目详情。
     *
     * @param id 项目 ID
     * @return 项目详情
     */
    public ProjectDetailVo getDetail(Long id) {
        Project project = requireProject(id);
        return toProjectVo(project, getCreatorMap(Set.of(project.getCreatorId())));
    }

    /**
     * 创建项目。
     *
     * @param request 创建请求
     * @return 项目详情
     */
    public ProjectDetailVo create(ProjectCreateRequest request) {
        boolean exists = lambdaQuery()
                .eq(Project::getCode, request.getCode().trim())
                .eq(Project::getDeleted, 0)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "项目编号已存在");
        }
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        String currentNickname = currentUser.getNickname();
        Project project = new Project();
        project.setCode(request.getCode().trim());
        project.setName(request.getName().trim());
        project.setDescription(normalizeDescription(request.getDescription()));
        project.setDbType(request.getDbType().trim());
        project.setCreatorId(currentUserId);
        project.setDeleted(0);
        save(project);
        return toProjectVo(project, Collections.singletonMap(currentUserId, currentNickname == null ? "" : currentNickname));
    }

    /**
     * 编辑项目。
     *
     * @param id 项目 ID
     * @param request 编辑请求
     * @return 项目详情
     */
    public ProjectDetailVo edit(Long id, ProjectEditRequest request) {
        Project project = requireProject(id);
        project.setName(request.getName().trim());
        project.setDescription(normalizeDescription(request.getDescription()));
        project.setDbType(request.getDbType().trim());
        updateById(project);
        return toProjectVo(project, getCreatorMap(Set.of(project.getCreatorId())));
    }

    /**
     * 逻辑删除项目。
     *
     * @param ids 项目 ID 列表
     * @return 删除数量
     */
    public int deleted(List<Long> ids) {
        List<Project> projects = lambdaQuery()
                .in(Project::getId, ids)
                .eq(Project::getDeleted, 0)
                .list();
        if (projects.isEmpty()) {
            return 0;
        }
        List<Long> projectIds = projects.stream().map(Project::getId).toList();
        lambdaUpdate()
                .in(Project::getId, projectIds)
                .set(Project::getDeleted, 1)
                .update();
        return projectIds.size();
    }

    /**
     * 校验并获取项目。
     *
     * @param id 项目 ID
     * @return 项目实体
     */
    public Project requireProject(Long id) {
        Project project = lambdaQuery()
                .eq(Project::getId, id)
                .eq(Project::getDeleted, 0)
                .last("limit 1")
                .one();
        if (project == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "项目不存在");
        }
        return project;
    }

    private List<ProjectDetailVo> toProjectVoList(List<Project> projects) {
        Set<Long> creatorIds = projects.stream()
                .map(Project::getCreatorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> creatorMap = getCreatorMap(creatorIds);
        return projects.stream()
                .map(project -> toProjectVo(project, creatorMap))
                .toList();
    }

    private Map<Long, String> getCreatorMap(Set<Long> creatorIds) {
        if (creatorIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(creatorIds)
                .values()
                .stream()
                .collect(Collectors.toMap(AuthUserSimpleDto::getId, user -> user.getNickname() == null ? "" : user.getNickname(), (left, right) -> left));
    }

    private ProjectDetailVo toProjectVo(Project project, Map<Long, String> creatorMap) {
        return ProjectDetailVo.builder()
                .id(project.getId())
                .code(project.getCode())
                .name(project.getName())
                .description(project.getDescription())
                .creator(creatorMap.getOrDefault(project.getCreatorId(), ""))
                .createdAt(formatDateTime(project.getCreateTime()))
                .updatedAt(formatDateTime(project.getUpdateTime()))
                .dbType(project.getDbType())
                .build();
    }

    private String normalizeDescription(String description) {
        return description == null ? "" : description.trim();
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME_FORMATTER.format(value);
    }
}
