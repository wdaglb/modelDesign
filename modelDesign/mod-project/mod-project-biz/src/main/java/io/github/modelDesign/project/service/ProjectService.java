package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.enums.ProjectStatusEnum;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.request.ProjectCreateRequest;
import io.github.modelDesign.project.request.ProjectEditRequest;
import io.github.modelDesign.project.request.ProjectListRequest;
import io.github.modelDesign.project.response.ProjectDetailVo;
import io.github.modelDesign.project.response.ProjectListResponse;
import io.github.modelDesign.project.response.ProjectStatusSummaryVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
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
     * 项目 GitLab 仓库绑定服务。
     */
    private final ProjectGitlabRepositoryService projectGitlabRepositoryService;

    /**
     * 获取项目列表。
     *
     * @param request 列表请求
     * @return 分页项目列表
     */
    public ProjectListResponse getList(ProjectListRequest request) {
        Long tenantId = requireCurrentTenantId();
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String keyword = resolveKeyword(request);
        String projectGroup = normalizeShortText(request.getProjectGroup());
        String status = normalizeOptionalStatus(request.getStatus());

        List<Project> baseProjects = lambdaQuery()
                .eq(Project::getTenantId, tenantId)
                .eq(Project::getDeleted, 0)
                .and(StringUtils.hasText(keyword), wrapper -> wrapper.like(Project::getName, keyword)
                        .or()
                        .like(Project::getCode, keyword))
                .eq(StringUtils.hasText(projectGroup), Project::getProjectGroup, projectGroup)
                .orderByDesc(Project::getUpdateTime)
                .list();
        ProjectStatusSummaryVo statusSummary = buildStatusSummary(baseProjects);
        List<String> groupOptions = listGroupOptions(tenantId);
        List<Project> filteredProjects = baseProjects.stream()
                .filter(project -> !StringUtils.hasText(status) || status.equals(project.getStatus()))
                .toList();
        long total = filteredProjects.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return ProjectListResponse.builder()
                    .items(Collections.emptyList())
                    .total(total)
                    .statusSummary(statusSummary)
                    .groupOptions(groupOptions)
                    .build();
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<Project> pageProjects = filteredProjects.subList((int) fromIndex, (int) toIndex);
        return ProjectListResponse.builder()
                .items(toProjectVoList(pageProjects))
                .total(total)
                .statusSummary(statusSummary)
                .groupOptions(groupOptions)
                .build();
    }

    /**
     * 获取项目详情。
     *
     * @param id 项目 ID
     * @return 项目详情
     */
    public ProjectDetailVo getDetail(Long id) {
        Project project = requireProject(id);
        return toProjectVoWithGitlabRepositories(project, getCreatorMap(Set.of(project.getCreatorId())));
    }

    /**
     * 创建项目。
     *
     * @param request 创建请求
     * @return 项目详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectDetailVo create(ProjectCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        boolean exists = lambdaQuery()
                .eq(Project::getTenantId, tenantId)
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
        project.setStatus(resolveStatusForCreate(request.getStatus()));
        project.setProjectGroup(normalizeShortText(request.getProjectGroup()));
        project.setProgressSummary(normalizeLongText(request.getProgressSummary()));
        project.setCompletedModuleCount(resolveCompletedModuleCount(request.getCompletedModuleCount(), 0));
        project.setCreatorId(currentUserId);
        project.setTenantId(tenantId);
        project.setDeleted(0);
        save(project);
        projectGitlabRepositoryService.saveBindings(
                tenantId,
                project.getId(),
                request.getGitlabRepositories()
        );
        String resolvedNickname = "";
        if (currentNickname != null) {
            resolvedNickname = currentNickname;
        }
        return toProjectVoWithGitlabRepositories(
                project,
                Collections.singletonMap(currentUserId, resolvedNickname)
        );
    }

    /**
     * 编辑项目。
     *
     * @param id 项目 ID
     * @param request 编辑请求
     * @return 项目详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectDetailVo edit(Long id, ProjectEditRequest request) {
        Project project = requireProject(id);
        project.setName(request.getName().trim());
        project.setDescription(normalizeDescription(request.getDescription()));
        project.setDbType(request.getDbType().trim());
        project.setStatus(resolveStatusForUpdate(request.getStatus(), project.getStatus()));
        project.setProjectGroup(resolveOptionalShortText(request.getProjectGroup(), project.getProjectGroup()));
        project.setProgressSummary(resolveOptionalLongText(request.getProgressSummary(), project.getProgressSummary()));
        project.setCompletedModuleCount(resolveCompletedModuleCount(
                request.getCompletedModuleCount(),
                project.getCompletedModuleCount()
        ));
        updateById(project);
        /**
         * 编辑 fallback 会故意不提交 GitLab 绑定字段。
         * 这表示只保存项目基础信息。
         * 空数组仍保留“主动清空绑定”的语义，不能与 null 混用。
         */
        if (request.getGitlabRepositories() != null) {
            projectGitlabRepositoryService.saveBindings(
                    project.getTenantId(),
                    project.getId(),
                    request.getGitlabRepositories()
            );
        }
        return toProjectVoWithGitlabRepositories(project, getCreatorMap(Set.of(project.getCreatorId())));
    }

    /**
     * 逻辑删除项目。
     *
     * @param ids 项目 ID 列表
     * @return 删除数量
     */
    public int deleted(List<Long> ids) {
        Long tenantId = requireCurrentTenantId();
        List<Project> projects = lambdaQuery()
                .eq(Project::getTenantId, tenantId)
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
        Long tenantId = requireCurrentTenantId();
        Project project = lambdaQuery()
                .eq(Project::getId, id)
                .eq(Project::getTenantId, tenantId)
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
                .collect(Collectors.toMap(AuthUserSimpleDto::getId, user -> {
                    if (user.getNickname() == null) {
                        return "";
                    }
                    return user.getNickname();
                }, (left, right) -> left));
    }

    private ProjectDetailVo toProjectVo(Project project, Map<Long, String> creatorMap) {
        return ProjectDetailVo.builder()
                .id(project.getId())
                .tenantId(project.getTenantId())
                .code(project.getCode())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .projectGroup(project.getProjectGroup())
                .progressSummary(project.getProgressSummary())
                .completedModuleCount(project.getCompletedModuleCount())
                .creator(creatorMap.getOrDefault(project.getCreatorId(), ""))
                .createdAt(formatDateTime(project.getCreateTime()))
                .updatedAt(formatDateTime(project.getUpdateTime()))
                .dbType(project.getDbType())
                .gitlabRepositories(Collections.emptyList())
                .build();
    }

    private ProjectDetailVo toProjectVoWithGitlabRepositories(Project project, Map<Long, String> creatorMap) {
        ProjectDetailVo projectVo = toProjectVo(project, creatorMap);
        projectVo.setGitlabRepositories(projectGitlabRepositoryService.listByProject(
                project.getTenantId(),
                project.getId()
        ));
        return projectVo;
    }

    private String normalizeDescription(String description) {
        return normalizeLongText(description);
    }

    private String resolveKeyword(ProjectListRequest request) {
        String keyword = normalizeShortText(request.getKeyword());
        if (StringUtils.hasText(keyword)) {
            return keyword;
        }
        return normalizeShortText(request.getName());
    }

    private String normalizeOptionalStatus(String status) {
        ProjectStatusEnum projectStatusEnum = ProjectStatusEnum.fromValue(status);
        if (status == null || status.isBlank()) {
            return null;
        }
        if (projectStatusEnum == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "项目状态不合法");
        }
        return projectStatusEnum.getValue();
    }

    private String resolveStatusForCreate(String status) {
        String normalizedStatus = normalizeOptionalStatus(status);
        if (StringUtils.hasText(normalizedStatus)) {
            return normalizedStatus;
        }
        return ProjectStatusEnum.PLANNING.getValue();
    }

    private String resolveStatusForUpdate(String status, String existingStatus) {
        String normalizedStatus = normalizeOptionalStatus(status);
        if (StringUtils.hasText(normalizedStatus)) {
            return normalizedStatus;
        }
        if (StringUtils.hasText(existingStatus)) {
            return existingStatus;
        }
        return ProjectStatusEnum.PLANNING.getValue();
    }

    private String normalizeShortText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private String normalizeLongText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private String resolveOptionalShortText(String nextValue, String existingValue) {
        if (nextValue == null) {
            return normalizeShortText(existingValue);
        }
        return normalizeShortText(nextValue);
    }

    private String resolveOptionalLongText(String nextValue, String existingValue) {
        if (nextValue == null) {
            return normalizeLongText(existingValue);
        }
        return normalizeLongText(nextValue);
    }

    private Integer resolveCompletedModuleCount(Integer nextValue, Integer fallbackValue) {
        if (nextValue != null) {
            return nextValue;
        }
        if (fallbackValue != null) {
            return fallbackValue;
        }
        return 0;
    }

    private List<String> listGroupOptions(Long tenantId) {
        List<Project> projects = lambdaQuery()
                .eq(Project::getTenantId, tenantId)
                .eq(Project::getDeleted, 0)
                .list();
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }

        return projects.stream()
                .map(Project::getProjectGroup)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    private ProjectStatusSummaryVo buildStatusSummary(List<Project> projects) {
        if (projects.isEmpty()) {
            return ProjectStatusSummaryVo.builder()
                    .all(0L)
                    .planning(0L)
                    .inProgress(0L)
                    .atRisk(0L)
                    .archived(0L)
                    .build();
        }

        Map<String, Long> countMap = projects.stream()
                .map(project -> resolveStatusForUpdate(project.getStatus(), null))
                .collect(Collectors.groupingBy(item -> item, Collectors.counting()));
        return ProjectStatusSummaryVo.builder()
                .all((long) projects.size())
                .planning(countMap.getOrDefault(ProjectStatusEnum.PLANNING.getValue(), 0L))
                .inProgress(countMap.getOrDefault(ProjectStatusEnum.IN_PROGRESS.getValue(), 0L))
                .atRisk(countMap.getOrDefault(ProjectStatusEnum.AT_RISK.getValue(), 0L))
                .archived(countMap.getOrDefault(ProjectStatusEnum.ARCHIVED.getValue(), 0L))
                .build();
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }

    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前租户 ID
     */
    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }
}
