package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目任务读模型服务，负责列表查询与分页排序逻辑。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskReadService {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 可用排序字段集合。
     */
    private static final Set<String> VALID_SORT_FIELD_SET = Set.of("priority", "startTime");

    /**
     * 可用排序方向集合。
     */
    private static final Set<String> VALID_SORT_ORDER_SET = Set.of("asc", "desc");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 任务写入规则校验服务。
     */
    private final ProjectTaskGuardService projectTaskGuardService;

    /**
     * 任务详情组装服务。
     */
    private final ProjectTaskViewAssembler projectTaskViewAssembler;

    /**
     * 获取我的待办列表（当前登录用户作为负责人的任务）。
     *
     * @param request 列表请求
     * @return 分页待办列表
     */
    public PageResponse<MyTodoItemVo> getMyTodoList(MyTodoListRequest request) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        Long tenantId = requireCurrentTenantId(currentUser);

        Set<Long> tenantProjectIds = getTenantProjectIds(tenantId);
        if (tenantProjectIds.isEmpty()) {
            return new PageResponse<>(Collections.emptyList(), 0L);
        }

        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String title = normalizeKeyword(request.getTitle());
        String priority = normalizeValue(request.getPriority());
        String status = normalizeValue(request.getStatus());
        if (StringUtils.hasText(status)) {
            status = projectTaskGuardService.validateStatus(status);
        }

        List<ProjectTask> allTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getAssigneeId, currentUserId)
                .in(ProjectTask::getProjectId, tenantProjectIds)
                .eq(ProjectTask::getDeleted, 0)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(StringUtils.hasText(status), ProjectTask::getStatus, status)
                .orderByDesc(ProjectTask::getCreateTime));

        long total = allTasks.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTask> pageTasks = allTasks.subList((int) fromIndex, (int) toIndex);

        Set<Long> creatorIds = new LinkedHashSet<>();
        Set<Long> projectIds = new LinkedHashSet<>();
        for (ProjectTask task : pageTasks) {
            if (task.getCreatorId() != null) {
                creatorIds.add(task.getCreatorId());
            }
            if (task.getProjectId() != null) {
                projectIds.add(task.getProjectId());
            }
        }

        Map<Long, String> creatorNameMap = getCreatorNameMap(creatorIds);
        Map<Long, String> projectNameMap = getProjectNameMap(projectIds);

        List<MyTodoItemVo> items = new ArrayList<>();
        for (ProjectTask task : pageTasks) {
            items.add(MyTodoItemVo.builder()
                    .id(task.getId())
                    .title(task.getTitle())
                    .receivedAt(formatDateTime(task.getCreateTime()))
                    .priority(task.getPriority())
                    .workDays(task.getWorkDays())
                    .status(task.getStatus())
                    .initiatorName(creatorNameMap.getOrDefault(task.getCreatorId(), ""))
                    .projectId(task.getProjectId())
                    .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                    .build());
        }
        return new PageResponse<>(items, total);
    }

    /**
     * 获取任务列表。
     *
     * @param request 列表请求
     * @return 分页任务列表
     */
    public PageResponse<ProjectTaskDetailVo> getList(ProjectTaskListRequest request) {
        projectService.requireProject(request.getProjectId());
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String title = normalizeKeyword(request.getTitle());
        String status = normalizeValue(request.getStatus());
        if (StringUtils.hasText(status)) {
            status = projectTaskGuardService.validateStatus(status);
        }
        String priority = normalizeValue(request.getPriority());
        String sortField = normalizeSortField(request.getSortField());
        String sortOrder = normalizeSortOrder(request.getSortOrder());

        List<ProjectTask> allTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getProjectId, request.getProjectId())
                .eq(ProjectTask::getDeleted, 0)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(status), ProjectTask::getStatus, status)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(request.getAssigneeId() != null, ProjectTask::getAssigneeId, request.getAssigneeId())
                .orderByDesc(ProjectTask::getUpdateTime));
        allTasks = sortTasks(allTasks, sortField, sortOrder);

        long total = allTasks.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTask> pageTasks = allTasks.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(projectTaskViewAssembler.toTaskVoList(pageTasks), total);
    }

    /**
     * 获取子任务列表。
     *
     * @param parentTask 父任务
     * @return 子任务列表
     */
    public List<ProjectTaskDetailVo> getChildren(ProjectTask parentTask) {
        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getParentTaskId, parentTask.getId())
                .eq(ProjectTask::getDeleted, 0)
                .orderByDesc(ProjectTask::getUpdateTime));
        return projectTaskViewAssembler.toTaskVoList(childTasks);
    }

    /**
     * 批量获取子任务列表。
     *
     * @param parentTasks 父任务列表
     * @return 子任务列表
     */
    public List<ProjectTaskDetailVo> getChildrenBatch(List<ProjectTask> parentTasks) {
        if (parentTasks == null || parentTasks.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> parentTaskIds = new LinkedHashSet<>();
        for (ProjectTask parentTask : parentTasks) {
            if (parentTask.getId() != null) {
                parentTaskIds.add(parentTask.getId());
            }
        }
        if (parentTaskIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getParentTaskId, parentTaskIds)
                .eq(ProjectTask::getDeleted, 0)
                .orderByDesc(ProjectTask::getUpdateTime));
        return projectTaskViewAssembler.toTaskVoList(childTasks);
    }

    /**
     * 按可见编号获取任务详情。
     *
     * @param code 任务编号
     * @return 任务详情
     */
    public ProjectTaskDetailVo getDetailByVisibleNumber(String code) {
        Long taskId = parseVisibleNumber(code);
        ProjectTask task = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getId, taskId)
                .eq(ProjectTask::getDeleted, 0)
                .last("limit 1"));
        if (task == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务不存在");
        }
        projectService.requireProject(task.getProjectId());
        return projectTaskViewAssembler.toTaskVo(task);
    }

    private Map<Long, String> getCreatorNameMap(Set<Long> creatorIds) {
        if (creatorIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(creatorIds);
        return userMap.values().stream().collect(Collectors.toMap(
                AuthUserSimpleDto::getId,
                user -> {
                    if (user.getNickname() == null) {
                        return "";
                    }
                    return user.getNickname();
                },
                (left, right) -> left));
    }

    private Map<Long, String> getProjectNameMap(Set<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Project> projects = projectMapper.selectBatchIds(projectIds);
        return projects.stream().collect(Collectors.toMap(Project::getId, Project::getName, (left, right) -> left));
    }

    private Set<Long> getTenantProjectIds(Long tenantId) {
        List<Project> projects = projectMapper.selectList(new LambdaQueryWrapper<Project>()
                .select(Project::getId)
                .eq(Project::getTenantId, tenantId)
                .eq(Project::getDeleted, 0));
        if (projects.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Long> projectIds = new HashSet<>();
        for (Project project : projects) {
            projectIds.add(project.getId());
        }
        return projectIds;
    }

    private List<ProjectTask> sortTasks(List<ProjectTask> tasks, String sortField, String sortOrder) {
        if (!StringUtils.hasText(sortField) || !StringUtils.hasText(sortOrder)) {
            return tasks;
        }
        Comparator<ProjectTask> comparator = null;
        if ("priority".equals(sortField)) {
            comparator = buildPriorityComparator(sortOrder);
        }
        if ("startTime".equals(sortField)) {
            comparator = buildStartTimeComparator(sortOrder);
        }
        if (comparator == null) {
            return tasks;
        }
        return tasks.stream()
                .sorted(comparator.thenComparing(ProjectTask::getUpdateTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private Comparator<ProjectTask> buildPriorityComparator(String sortOrder) {
        Comparator<ProjectTask> comparator = Comparator.comparingInt(task -> getPriorityRank(task.getPriority()));
        if ("desc".equals(sortOrder)) {
            return comparator.reversed();
        }
        return comparator;
    }

    private Comparator<ProjectTask> buildStartTimeComparator(String sortOrder) {
        return (left, right) -> compareNullableDateTime(left.getStartTime(), right.getStartTime(), sortOrder);
    }

    private int compareNullableDateTime(LocalDateTime left, LocalDateTime right, String sortOrder) {
        if (left == null && right == null) {
            return 0;
        }
        if (left == null) {
            return 1;
        }
        if (right == null) {
            return -1;
        }
        if ("desc".equals(sortOrder)) {
            return right.compareTo(left);
        }
        return left.compareTo(right);
    }

    private int getPriorityRank(String priority) {
        if ("low".equals(priority)) {
            return 1;
        }
        if ("medium".equals(priority)) {
            return 2;
        }
        if ("high".equals(priority)) {
            return 3;
        }
        return 0;
    }

    private Long requireCurrentTenantId(AuthCurrentUserDto currentUser) {
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }

    private String normalizeKeyword(String value) {
        if (value == null) {
            return null;
        }
        String trimmedValue = value.trim();
        if (!StringUtils.hasText(trimmedValue)) {
            return null;
        }
        return trimmedValue;
    }

    private String normalizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }

    private String normalizeSortField(String value) {
        String normalizedValue = normalizeValue(value);
        if (!StringUtils.hasText(normalizedValue) || !VALID_SORT_FIELD_SET.contains(normalizedValue)) {
            return null;
        }
        return normalizedValue;
    }

    private String normalizeSortOrder(String value) {
        String normalizedValue = normalizeValue(value);
        if (!StringUtils.hasText(normalizedValue) || !VALID_SORT_ORDER_SET.contains(normalizedValue)) {
            return null;
        }
        return normalizedValue;
    }

    private Long parseVisibleNumber(String code) {
        String normalizedCode = normalizeValue(code);
        if (!StringUtils.hasText(normalizedCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号不合法");
        }
        String numericPart = normalizedCode;
        if (normalizedCode.startsWith("TASK-")) {
            numericPart = normalizedCode.substring("TASK-".length());
        } else {
            if (!isDigits(normalizedCode)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号不合法");
            }
        }
        if (!isDigits(numericPart)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号不合法");
        }
        try {
            Long taskId = Long.parseLong(numericPart);
            if (taskId <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号不合法");
            }
            return taskId;
        } catch (NumberFormatException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号不合法");
        }
    }

    private boolean isDigits(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        for (int index = 0; index < value.length(); index++) {
            char currentChar = value.charAt(index);
            if (!Character.isDigit(currentChar)) {
                return false;
            }
        }
        return true;
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
