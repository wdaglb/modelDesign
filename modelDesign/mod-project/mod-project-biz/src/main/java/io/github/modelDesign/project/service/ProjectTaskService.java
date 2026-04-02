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
import io.github.modelDesign.project.request.ProjectTaskChangeLogListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskChangeLogItemVo;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
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
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

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
     * 任务变更日志服务。
     */
    private final ProjectTaskChangeLogService projectTaskChangeLogService;

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
        if (StringUtils.hasText(status)) {
            status = validateStatus(status);
        }

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
                        .workDays(task.getWorkDays())
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
        if (StringUtils.hasText(status)) {
            status = validateStatus(status);
        }
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
        return toTaskVo(task, getUserMap(task), getProjectNameMap(task));
    }

    /**
     * 获取任务变更日志列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<ProjectTaskChangeLogItemVo> getChangeLogList(ProjectTaskChangeLogListRequest request) {
        return projectTaskChangeLogService.getList(request);
    }

    /**
     * 创建任务。
     *
     * @param request 创建请求
     * @return 任务详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskDetailVo create(ProjectTaskCreateRequest request) {
        projectService.requireProject(request.getProjectId());
        String status = validateStatus(request.getStatus());
        validatePriority(request.getPriority());
        validateWorkDays(request.getWorkDays());
        validateTimeRange(request.getStartTime(), request.getDueTime());
        validateAssignee(request.getAssigneeId());
        ensureProjectMember(request.getProjectId(), request.getAssigneeId());
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        ProjectTask task = new ProjectTask();
        task.setProjectId(request.getProjectId());
        task.setTitle(request.getTitle().trim());
        task.setDescription(normalizeDescription(request.getDescription()));
        task.setStatus(status);
        task.setPriority(request.getPriority().trim());
        task.setWorkDays(request.getWorkDays());
        task.setCreatorId(currentUser.getUserId());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
        task.setDeleted(0);
        save(task);
        ensureAssigneeMember(task);
        projectTaskChangeLogService.logCreate(task);
        return toTaskVo(task, getUserMap(task), getProjectNameMap(task));
    }

    /**
     * 编辑任务。
     *
     * @param id 任务 ID
     * @param request 编辑请求
     * @return 任务详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskDetailVo edit(Long id, ProjectTaskEditRequest request) {
        ProjectTask task = requireTask(id);
        ProjectTask beforeTask = copyTask(task);
        String status = validateStatus(request.getStatus());
        validatePriority(request.getPriority());
        validateWorkDays(request.getWorkDays());
        validateTimeRange(request.getStartTime(), request.getDueTime());
        validateAssignee(request.getAssigneeId());
        ensureProjectMember(task.getProjectId(), request.getAssigneeId());
        task.setTitle(request.getTitle().trim());
        task.setDescription(normalizeDescription(request.getDescription()));
        task.setStatus(status);
        task.setPriority(request.getPriority().trim());
        task.setWorkDays(request.getWorkDays());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
        updateById(task);
        ensureAssigneeMember(task);
        projectTaskChangeLogService.logUpdate(beforeTask, task);
        return toTaskVo(task, getUserMap(task), getProjectNameMap(task));
    }

    /**
     * 逻辑删除任务。
     *
     * @param ids 任务 ID 列表
     * @return 删除数量
     */
    @Transactional(rollbackFor = Exception.class)
    public int deleted(List<Long> ids) {
        List<ProjectTask> tasks = lambdaQuery()
                .in(ProjectTask::getId, ids)
                .eq(ProjectTask::getDeleted, 0)
                .list();
        if (tasks.isEmpty()) {
            return 0;
        }
        for (ProjectTask task : tasks) {
            projectTaskChangeLogService.logDelete(task);
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

    /**
     * 批量转换任务详情视图对象列表。
     *
     * @param tasks 任务实体列表
     * @return 任务详情视图对象列表
     */
    private List<ProjectTaskDetailVo> toTaskVoList(List<ProjectTask> tasks) {
        Set<Long> userIds = new HashSet<>();
        Set<Long> projectIds = new HashSet<>();
        for (ProjectTask task : tasks) {
            if (task.getCreatorId() != null) {
                userIds.add(task.getCreatorId());
            }
            if (task.getAssigneeId() != null) {
                userIds.add(task.getAssigneeId());
            }
            if (task.getProjectId() != null) {
                projectIds.add(task.getProjectId());
            }
        }
        Map<Long, AuthUserSimpleDto> userMap = getUserMap(userIds);
        Map<Long, String> projectNameMap = getProjectNameMap(projectIds);
        return tasks.stream()
                .map(task -> toTaskVo(task, userMap, projectNameMap))
                .toList();
    }

    /**
     * 获取单个任务关联的用户信息映射。
     *
     * @param task 任务实体
     * @return 用户 ID 到用户信息的映射
     */
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

    /**
     * 获取单个任务关联的项目名称映射。
     *
     * @param task 任务实体
     * @return 项目 ID 到项目名称的映射
     */
    private Map<Long, String> getProjectNameMap(ProjectTask task) {
        Set<Long> projectIds = new HashSet<>();
        if (task.getProjectId() != null) {
            projectIds.add(task.getProjectId());
        }
        return getProjectNameMap(projectIds);
    }

    /**
     * 对任务列表执行内存排序。
     *
     * @param tasks 任务实体列表
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 排序后的任务实体列表
     */
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

    /**
     * 构建优先级排序比较器。
     *
     * @param sortOrder 排序方向
     * @return 优先级比较器
     */
    private Comparator<ProjectTask> buildPriorityComparator(String sortOrder) {
        Comparator<ProjectTask> comparator = Comparator.comparingInt(task -> getPriorityRank(task.getPriority()));
        if ("desc".equals(sortOrder)) {
            return comparator.reversed();
        }
        return comparator;
    }

    /**
     * 构建开始时间排序比较器。
     *
     * @param sortOrder 排序方向
     * @return 开始时间比较器
     */
    private Comparator<ProjectTask> buildStartTimeComparator(String sortOrder) {
        return (left, right) -> {
            int result = compareNullableDateTime(left.getStartTime(), right.getStartTime(), sortOrder);
            if (result != 0) {
                return result;
            }
            return 0;
        };
    }

    /**
     * 比较允许为空的时间值。
     *
     * @param left 左侧时间
     * @param right 右侧时间
     * @param sortOrder 排序方向
     * @return 比较结果
     */
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

    /**
     * 获取优先级权重值。
     *
     * @param priority 优先级
     * @return 优先级权重值
     */
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

    /**
     * 批量获取用户信息映射。
     *
     * @param userIds 用户 ID 集合
     * @return 用户 ID 到用户信息的映射
     */
    private Map<Long, AuthUserSimpleDto> getUserMap(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return authUserApi.getUserMapByIds(userIds);
    }

    /**
     * 批量获取项目名称映射。
     *
     * @param projectIds 项目 ID 集合
     * @return 项目 ID 到项目名称的映射
     */
    private Map<Long, String> getProjectNameMap(Set<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return projectMapper.selectBatchIds(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Project::getName, (left, right) -> left));
    }

    /**
     * 转换单个任务详情视图对象。
     *
     * @param task 任务实体
     * @param userMap 用户信息映射
     * @return 任务详情视图对象
     */
    private ProjectTaskDetailVo toTaskVo(
            ProjectTask task,
            Map<Long, AuthUserSimpleDto> userMap,
            Map<Long, String> projectNameMap) {
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
                .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .workDays(task.getWorkDays())
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

    /**
     * 校验任务状态是否合法。
     *
     * @param status 任务状态
     * @return 配置中实际保存的任务状态编码
     */
    private String validateStatus(String status) {
        return taskStatusConfigService.normalizeAndRequireStatusCode(status);
    }

    /**
     * 校验任务优先级是否合法。
     *
     * @param priority 任务优先级
     */
    private void validatePriority(String priority) {
        String value = normalizeValue(priority);
        if (!StringUtils.hasText(value) || !VALID_PRIORITY_SET.contains(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务优先级不合法");
        }
    }

    /**
     * 校验预计工时是否合法。
     *
     * @param workDays 预计工时
     */
    private void validateWorkDays(BigDecimal workDays) {
        if (workDays == null) {
            return;
        }
        if (workDays.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "预计工时必须大于 0");
        }
        BigDecimal multipliedValue = workDays.multiply(BigDecimal.valueOf(2));
        if (multipliedValue.stripTrailingZeros().scale() > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "预计工时必须按 0.5 人天递增");
        }
    }

    /**
     * 校验任务时间范围是否合法。
     *
     * @param startTime 开始时间
     * @param dueTime 截止时间
     */
    private void validateTimeRange(LocalDateTime startTime, LocalDateTime dueTime) {
        if (startTime == null || dueTime == null) {
            return;
        }
        if (startTime.isAfter(dueTime)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "开始时间不能晚于截止时间");
        }
    }

    /**
     * 校验负责人是否存在。
     *
     * @param assigneeId 负责人 ID
     */
    private void validateAssignee(Long assigneeId) {
        if (assigneeId == null || assigneeId.equals(0L)) {
            return;
        }

        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(Set.of(assigneeId));
        if (userMap.containsKey(assigneeId)) {
            return;
        }

        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "负责人不存在");
    }

    /**
     * 确保负责人已加入项目成员。
     *
     * @param projectId 项目 ID
     * @param assigneeId 负责人 ID
     */
    private void ensureProjectMember(Long projectId, Long assigneeId) {
        if (assigneeId == null || assigneeId.equals(0L)) {
            return;
        }

        ProjectMember member = projectMemberMapper.selectOne(new LambdaQueryWrapper<ProjectMember>()
                .eq(ProjectMember::getProjectId, projectId)
                .eq(ProjectMember::getUserId, assigneeId)
                .last("limit 1"));

        if (member != null) {
            return;
        }

        ProjectMember projectMember = new ProjectMember();
        projectMember.setProjectId(projectId);
        projectMember.setUserId(assigneeId);
        projectMemberMapper.insert(projectMember);
    }

    /**
     * 确保负责人已同步为任务成员。
     *
     * @param task 任务实体
     */
    private void ensureAssigneeMember(ProjectTask task) {
        if (task.getAssigneeId() == null) {
            return;
        }
        if (task.getAssigneeId().equals(0L)) {
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

    /**
     * 复制任务快照。
     *
     * @param source 原任务
     * @return 快照副本
     */
    private ProjectTask copyTask(ProjectTask source) {
        ProjectTask target = new ProjectTask();
        target.setId(source.getId());
        target.setProjectId(source.getProjectId());
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setStatus(source.getStatus());
        target.setPriority(source.getPriority());
        target.setCreatorId(source.getCreatorId());
        target.setAssigneeId(source.getAssigneeId());
        target.setWorkDays(source.getWorkDays());
        target.setStartTime(source.getStartTime());
        target.setDueTime(source.getDueTime());
        target.setDeleted(source.getDeleted());
        target.setCreateTime(source.getCreateTime());
        target.setUpdateTime(source.getUpdateTime());
        return target;
    }

    /**
     * 规范化任务描述内容。
     *
     * @param description 任务描述
     * @return 规范化后的描述
     */
    private String normalizeDescription(String description) {
        if (description == null) {
            return "";
        }
        return description.trim();
    }

    /**
     * 规范化关键词筛选值。
     *
     * @param value 原始关键词
     * @return 规范化后的关键词
     */
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

    /**
     * 规范化通用字符串值。
     *
     * @param value 原始值
     * @return 去除首尾空格后的值
     */
    private String normalizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }

    /**
     * 规范化排序字段。
     *
     * @param value 原始排序字段
     * @return 合法的排序字段，非法时返回 null
     */
    private String normalizeSortField(String value) {
        String normalizedValue = normalizeValue(value);
        if (!StringUtils.hasText(normalizedValue) || !VALID_SORT_FIELD_SET.contains(normalizedValue)) {
            return null;
        }
        return normalizedValue;
    }

    /**
     * 规范化排序方向。
     *
     * @param value 原始排序方向
     * @return 合法的排序方向，非法时返回 null
     */
    private String normalizeSortOrder(String value) {
        String normalizedValue = normalizeValue(value);
        if (!StringUtils.hasText(normalizedValue) || !VALID_SORT_ORDER_SET.contains(normalizedValue)) {
            return null;
        }
        return normalizedValue;
    }

    /**
     * 格式化时间为字符串。
     *
     * @param value 时间值
     * @return 格式化后的时间字符串
     */
    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
