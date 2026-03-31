package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectMember;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectMemberMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目任务服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskService extends ServiceImpl<ProjectTaskMapper, ProjectTask> implements IService<ProjectTask> {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 可用状态集合。
     */
    private static final Set<String> VALID_STATUS_SET = Set.of("todo", "inProgress", "done", "canceled");

    /**
     * 可用优先级集合。
     */
    private static final Set<String> VALID_PRIORITY_SET = Set.of("low", "medium", "high");

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
     * 项目成员 Mapper。
     */
    private final ProjectMemberMapper projectMemberMapper;

    /**
     * 项目任务成员 Mapper。
     */
    private final ProjectTaskMemberMapper projectTaskMemberMapper;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 获取我的待办列表（当前登录用户作为负责人的任务）。
     *
     * @param request 列表请求
     * @return 分页待办列表
     */
    public PageResponse<MyTodoItemVo> getMyTodoList(MyTodoListRequest request) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long currentUserId = currentUser.getUserId();

        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        String title = normalizeKeyword(request.getTitle());
        String priority = normalizeValue(request.getPriority());
        String status = normalizeValue(request.getStatus());

        // 查询当前用户为负责人的所有未删除任务
        List<ProjectTask> allTasks = lambdaQuery()
                .eq(ProjectTask::getAssigneeId, currentUserId)
                .eq(ProjectTask::getDeleted, 0)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(StringUtils.hasText(status), ProjectTask::getStatus, status)
                .orderByDesc(ProjectTask::getCreateTime)
                .list();

        long total = allTasks.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTask> pageTasks = allTasks.subList((int) fromIndex, (int) toIndex);

        // 收集所有创建人 ID 及项目 ID
        Set<Long> creatorIds = pageTasks.stream()
                .map(ProjectTask::getCreatorId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> projectIds = pageTasks.stream()
                .map(ProjectTask::getProjectId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        // 批量查询创建人昵称
        Map<Long, String> creatorNameMap = creatorIds.isEmpty()
                ? Collections.emptyMap()
                : authUserApi.getUserMapByIds(creatorIds).entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().getNickname() == null ? "" : e.getValue().getNickname(),
                                (l, r) -> l));

        // 批量查询项目名称
        Map<Long, String> projectNameMap = projectIds.isEmpty()
                ? Collections.emptyMap()
                : projectMapper.selectBatchIds(projectIds).stream()
                        .collect(Collectors.toMap(Project::getId, Project::getName, (l, r) -> l));

        List<MyTodoItemVo> items = pageTasks.stream()
                .map(task -> MyTodoItemVo.builder()
                        .id(task.getId())
                        .title(task.getTitle())
                        .receivedAt(formatDateTime(task.getCreateTime()))
                        .priority(task.getPriority())
                        .status(task.getStatus())
                        .initiatorName(creatorNameMap.getOrDefault(task.getCreatorId(), ""))
                        .projectId(task.getProjectId())
                        .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                        .build())
                .toList();

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
        String priority = normalizeValue(request.getPriority());
        String sortField = normalizeSortField(request.getSortField());
        String sortOrder = normalizeSortOrder(request.getSortOrder());
        List<ProjectTask> allTasks = lambdaQuery()
                .eq(ProjectTask::getProjectId, request.getProjectId())
                .eq(ProjectTask::getDeleted, 0)
                .like(StringUtils.hasText(title), ProjectTask::getTitle, title)
                .eq(StringUtils.hasText(status), ProjectTask::getStatus, status)
                .eq(StringUtils.hasText(priority), ProjectTask::getPriority, priority)
                .eq(request.getAssigneeId() != null, ProjectTask::getAssigneeId, request.getAssigneeId())
                .orderByDesc(ProjectTask::getUpdateTime)
                .list();
        allTasks = sortTasks(allTasks, sortField, sortOrder);
        long total = allTasks.size();
        long fromIndex = Math.max((current - 1) * pageSize, 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTask> pageTasks = allTasks.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(toTaskVoList(pageTasks), total);
    }

    /**
     * 获取任务详情。
     *
     * @param id 任务 ID
     * @return 任务详情
     */
    public ProjectTaskDetailVo getDetail(Long id) {
        ProjectTask task = requireTask(id);
        return toTaskVo(task, getUserMap(task));
    }

    /**
     * 创建任务。
     *
     * @param request 创建请求
     * @return 任务详情
     */
    public ProjectTaskDetailVo create(ProjectTaskCreateRequest request) {
        projectService.requireProject(request.getProjectId());
        validateStatus(request.getStatus());
        validatePriority(request.getPriority());
        validateTimeRange(request.getStartTime(), request.getDueTime());
        validateAssignee(request.getProjectId(), request.getAssigneeId());
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        ProjectTask task = new ProjectTask();
        task.setProjectId(request.getProjectId());
        task.setTitle(request.getTitle().trim());
        task.setDescription(normalizeDescription(request.getDescription()));
        task.setStatus(request.getStatus().trim());
        task.setPriority(request.getPriority().trim());
        task.setCreatorId(currentUser.getUserId());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
        task.setDeleted(0);
        save(task);
        ensureAssigneeMember(task);
        return toTaskVo(task, getUserMap(task));
    }

    /**
     * 编辑任务。
     *
     * @param id 任务 ID
     * @param request 编辑请求
     * @return 任务详情
     */
    public ProjectTaskDetailVo edit(Long id, ProjectTaskEditRequest request) {
        ProjectTask task = requireTask(id);
        validateStatus(request.getStatus());
        validatePriority(request.getPriority());
        validateTimeRange(request.getStartTime(), request.getDueTime());
        validateAssignee(task.getProjectId(), request.getAssigneeId());
        task.setTitle(request.getTitle().trim());
        task.setDescription(normalizeDescription(request.getDescription()));
        task.setStatus(request.getStatus().trim());
        task.setPriority(request.getPriority().trim());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
        updateById(task);
        ensureAssigneeMember(task);
        return toTaskVo(task, getUserMap(task));
    }

    /**
     * 逻辑删除任务。
     *
     * @param ids 任务 ID 列表
     * @return 删除数量
     */
    public int deleted(List<Long> ids) {
        List<ProjectTask> tasks = lambdaQuery()
                .in(ProjectTask::getId, ids)
                .eq(ProjectTask::getDeleted, 0)
                .list();
        if (tasks.isEmpty()) {
            return 0;
        }
        List<Long> taskIds = tasks.stream().map(ProjectTask::getId).toList();
        lambdaUpdate()
                .in(ProjectTask::getId, taskIds)
                .set(ProjectTask::getDeleted, 1)
                .update();
        return taskIds.size();
    }

    /**
     * 校验并获取任务。
     *
     * @param id 任务 ID
     * @return 任务实体
     */
    public ProjectTask requireTask(Long id) {
        ProjectTask task = lambdaQuery()
                .eq(ProjectTask::getId, id)
                .eq(ProjectTask::getDeleted, 0)
                .last("limit 1")
                .one();
        if (task == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务不存在");
        }
        return task;
    }

    private List<ProjectTaskDetailVo> toTaskVoList(List<ProjectTask> tasks) {
        Set<Long> userIds = new HashSet<>();
        for (ProjectTask task : tasks) {
            if (task.getCreatorId() != null) {
                userIds.add(task.getCreatorId());
            }
            if (task.getAssigneeId() != null) {
                userIds.add(task.getAssigneeId());
            }
        }
        Map<Long, AuthUserSimpleDto> userMap = getUserMap(userIds);
        return tasks.stream()
                .map(task -> toTaskVo(task, userMap))
                .toList();
    }

    private Map<Long, AuthUserSimpleDto> getUserMap(ProjectTask task) {
        Set<Long> userIds = new HashSet<>();
        if (task.getCreatorId() != null) {
            userIds.add(task.getCreatorId());
        }
        if (task.getAssigneeId() != null) {
            userIds.add(task.getAssigneeId());
        }
        return getUserMap(userIds);
    }

    private List<ProjectTask> sortTasks(List<ProjectTask> tasks, String sortField, String sortOrder) {
        if (!StringUtils.hasText(sortField) || !StringUtils.hasText(sortOrder)) {
            return tasks;
        }
        Comparator<ProjectTask> comparator = switch (sortField) {
            case "priority" -> buildPriorityComparator(sortOrder);
            case "startTime" -> buildStartTimeComparator(sortOrder);
            default -> null;
        };
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
        return (left, right) -> {
            int result = compareNullableDateTime(left.getStartTime(), right.getStartTime(), sortOrder);
            if (result != 0) {
                return result;
            }
            return 0;
        };
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

    private Map<Long, AuthUserSimpleDto> getUserMap(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(userIds);
    }

    private ProjectTaskDetailVo toTaskVo(ProjectTask task, Map<Long, AuthUserSimpleDto> userMap) {
        String creator = "";
        AuthUserSimpleDto creatorUser = userMap.get(task.getCreatorId());
        if (creatorUser != null && creatorUser.getNickname() != null) {
            creator = creatorUser.getNickname();
        }
        String assignee = "";
        AuthUserSimpleDto assigneeUser = userMap.get(task.getAssigneeId());
        if (assigneeUser != null && assigneeUser.getNickname() != null) {
            assignee = assigneeUser.getNickname();
        }
        return ProjectTaskDetailVo.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .assigneeId(task.getAssigneeId())
                .assignee(assignee)
                .creatorId(task.getCreatorId())
                .creator(creator)
                .startTime(formatDateTime(task.getStartTime()))
                .dueTime(formatDateTime(task.getDueTime()))
                .createdAt(formatDateTime(task.getCreateTime()))
                .updatedAt(formatDateTime(task.getUpdateTime()))
                .build();
    }

    private void validateStatus(String status) {
        String value = normalizeValue(status);
        if (!StringUtils.hasText(value) || !VALID_STATUS_SET.contains(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务状态不合法");
        }
    }

    private void validatePriority(String priority) {
        String value = normalizeValue(priority);
        if (!StringUtils.hasText(value) || !VALID_PRIORITY_SET.contains(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务优先级不合法");
        }
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime dueTime) {
        if (startTime == null || dueTime == null) {
            return;
        }
        if (startTime.isAfter(dueTime)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "开始时间不能晚于截止时间");
        }
    }

    private void validateAssignee(Long projectId, Long assigneeId) {
        if (assigneeId == null) {
            return;
        }
        ProjectMember member = projectMemberMapper.selectOne(new LambdaQueryWrapper<ProjectMember>()
                .eq(ProjectMember::getProjectId, projectId)
                .eq(ProjectMember::getUserId, assigneeId)
                .last("limit 1"));
        if (member == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "负责人必须先加入项目");
        }
    }

    private void ensureAssigneeMember(ProjectTask task) {
        if (task.getAssigneeId() == null) {
            return;
        }
        ProjectTaskMember existedMember = projectTaskMemberMapper.selectOne(new LambdaQueryWrapper<ProjectTaskMember>()
                .eq(ProjectTaskMember::getTaskId, task.getId())
                .eq(ProjectTaskMember::getUserId, task.getAssigneeId())
                .last("limit 1"));
        if (existedMember != null) {
            return;
        }
        ProjectTaskMember taskMember = new ProjectTaskMember();
        taskMember.setTaskId(task.getId());
        taskMember.setUserId(task.getAssigneeId());
        projectTaskMemberMapper.insert(taskMember);
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return "";
        }
        return description.trim();
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

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
