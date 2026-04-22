package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDynamicDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportTaskDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskDynamic;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskDynamicMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 当前登录用户工作汇报服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskWorkReportService {
    /**
     * 已完成状态集合。
     */
    private static final Set<String> FINISHED_STATUS_SET =
            Set.of("done", "canceled");

    /**
     * 支持的汇报类型集合。
     */
    private static final Set<String> SUPPORTED_REPORT_TYPE_SET =
            Set.of("daily", "weekly", "monthly", "yearly");

    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 日期格式化器。
     */
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 任务成员 Mapper。
     */
    private final ProjectTaskMemberMapper projectTaskMemberMapper;

    /**
     * 任务动态 Mapper。
     */
    private final ProjectTaskDynamicMapper projectTaskDynamicMapper;

    /**
     * 生成当前登录用户的工作汇报。
     *
     * 这里统一在服务层完成“周期边界、参与身份、任务/动态取数”的口径收敛，
     * 让 AI 工具层只负责展示文案，不再重复维护业务筛选规则。
     *
     * @param command 汇报查询命令
     * @return 汇报结果
     */
    public ProjectTaskWorkReportDto generateCurrentUserReport(
            ProjectTaskWorkReportCommand command) {
        String reportType = normalizeReportType(command);
        LocalDate referenceDate = resolveReferenceDate(command);
        LocalDateTime periodStart = resolvePeriodStart(reportType, referenceDate);
        LocalDateTime periodEnd = resolvePeriodEnd(reportType, referenceDate);

        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        Long tenantId = requireCurrentTenantId(currentUser);

        Set<Long> tenantProjectIds = findTenantProjectIds(tenantId);
        if (tenantProjectIds.isEmpty()) {
            return buildEmptyReport(reportType, periodStart, periodEnd);
        }

        Set<Long> memberTaskIds = findMemberTaskIds(currentUserId);
        List<ProjectTask> assigneeTasks = findAssigneeTasks(
                currentUserId,
                tenantProjectIds
        );
        Set<Long> participantTaskIds = new LinkedHashSet<>();
        for (ProjectTask assigneeTask : assigneeTasks) {
            participantTaskIds.add(assigneeTask.getId());
        }
        participantTaskIds.addAll(memberTaskIds);
        if (participantTaskIds.isEmpty()) {
            return buildEmptyReport(reportType, periodStart, periodEnd);
        }

        List<ProjectTask> participantTasks = projectTaskMapper.selectList(
                new LambdaQueryWrapper<ProjectTask>()
                        .in(ProjectTask::getId, participantTaskIds)
                        .in(ProjectTask::getProjectId, tenantProjectIds)
                        .eq(ProjectTask::getDeleted, 0)
        );
        if (participantTasks.isEmpty()) {
            return buildEmptyReport(reportType, periodStart, periodEnd);
        }

        Set<Long> taskIds = new LinkedHashSet<>();
        for (ProjectTask participantTask : participantTasks) {
            taskIds.add(participantTask.getId());
        }

        List<ProjectTaskDynamic> periodDynamics = projectTaskDynamicMapper.selectList(
                new LambdaQueryWrapper<ProjectTaskDynamic>()
                        .in(ProjectTaskDynamic::getTaskId, taskIds)
                        .ge(ProjectTaskDynamic::getCreateTime, periodStart)
                        .le(ProjectTaskDynamic::getCreateTime, periodEnd)
                        .orderByAsc(ProjectTaskDynamic::getCreateTime)
                        .orderByAsc(ProjectTaskDynamic::getId)
        );

        Set<Long> relevantTaskIds = collectRelevantTaskIds(
                participantTasks,
                periodDynamics,
                reportType,
                periodStart,
                periodEnd
        );

        List<ProjectTask> relevantTasks = new ArrayList<>();
        for (ProjectTask participantTask : participantTasks) {
            if (relevantTaskIds.contains(participantTask.getId())) {
                relevantTasks.add(participantTask);
            }
        }
        relevantTasks.sort(buildTaskComparator());

        List<ProjectTaskDynamic> relevantDynamics = filterRelevantDynamics(
                periodDynamics,
                participantTasks,
                relevantTaskIds,
                reportType
        );

        Map<Long, String> projectNameMap = getProjectNameMap(relevantTasks);
        Map<Long, String> taskRoleMap = buildParticipationRoleMap(
                relevantTasks,
                currentUserId,
                memberTaskIds
        );
        Map<Long, String> latestDynamicSummaryMap =
                buildLatestDynamicSummaryMap(relevantDynamics);
        Map<Long, String> operatorNameMap = getOperatorNameMap(relevantDynamics);

        List<ProjectTaskWorkReportTaskDto> taskDtos = buildTaskDtos(
                relevantTasks,
                projectNameMap,
                taskRoleMap,
                latestDynamicSummaryMap
        );
        List<ProjectTaskWorkReportDynamicDto> dynamicDtos = buildDynamicDtos(
                relevantDynamics,
                relevantTasks,
                projectNameMap,
                operatorNameMap
        );

        return ProjectTaskWorkReportDto.builder()
                .reportType(reportType)
                .reportTitle(buildReportTitle(reportType, referenceDate))
                .periodStart(formatDateTime(periodStart))
                .periodEnd(formatDateTime(periodEnd))
                .tasks(taskDtos)
                .dynamics(dynamicDtos)
                .build();
    }

    /**
     * 构造空汇报结果。
     *
     * @param reportType 汇报类型
     * @param periodStart 统计起始
     * @param periodEnd 统计结束
     * @return 空汇报
     */
    private ProjectTaskWorkReportDto buildEmptyReport(
            String reportType,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {
        return ProjectTaskWorkReportDto.builder()
                .reportType(reportType)
                .reportTitle(buildReportTitle(reportType, periodStart.toLocalDate()))
                .periodStart(formatDateTime(periodStart))
                .periodEnd(formatDateTime(periodEnd))
                .tasks(Collections.emptyList())
                .dynamics(Collections.emptyList())
                .build();
    }

    /**
     * 归一化汇报类型。
     *
     * @param command 汇报查询命令
     * @return 归一化后的汇报类型
     */
    private String normalizeReportType(ProjectTaskWorkReportCommand command) {
        if (command == null || !StringUtils.hasText(command.getReportType())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "汇报类型不能为空"
            );
        }
        String reportType = command.getReportType().trim().toLowerCase();
        if (!SUPPORTED_REPORT_TYPE_SET.contains(reportType)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "汇报类型不支持"
            );
        }
        return reportType;
    }

    /**
     * 解析参考日期。
     *
     * @param command 汇报查询命令
     * @return 参考日期
     */
    private LocalDate resolveReferenceDate(ProjectTaskWorkReportCommand command) {
        if (command == null || command.getReferenceDate() == null) {
            return LocalDate.now();
        }
        return command.getReferenceDate();
    }

    /**
     * 解析统计区间开始时间。
     *
     * @param reportType 汇报类型
     * @param referenceDate 参考日期
     * @return 区间开始
     */
    private LocalDateTime resolvePeriodStart(
            String reportType,
            LocalDate referenceDate) {
        LocalDate startDate = referenceDate;
        if ("weekly".equals(reportType)) {
            startDate = referenceDate.with(
                    TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)
            );
        }
        if ("monthly".equals(reportType)) {
            startDate = referenceDate.withDayOfMonth(1);
        }
        if ("yearly".equals(reportType)) {
            startDate = referenceDate.withDayOfYear(1);
        }
        return LocalDateTime.of(startDate, LocalTime.MIN);
    }

    /**
     * 解析统计区间结束时间。
     *
     * @param reportType 汇报类型
     * @param referenceDate 参考日期
     * @return 区间结束
     */
    private LocalDateTime resolvePeriodEnd(
            String reportType,
            LocalDate referenceDate) {
        LocalDate endDate = referenceDate;
        if ("weekly".equals(reportType)) {
            endDate = referenceDate.with(
                    TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)
            );
        }
        if ("monthly".equals(reportType)) {
            endDate = referenceDate.with(
                    TemporalAdjusters.lastDayOfMonth()
            );
        }
        if ("yearly".equals(reportType)) {
            endDate = referenceDate.with(
                    TemporalAdjusters.lastDayOfYear()
            );
        }
        return LocalDateTime.of(endDate, LocalTime.MAX);
    }

    /**
     * 查询租户下全部可见项目 ID。
     *
     * @param tenantId 租户 ID
     * @return 项目 ID 集合
     */
    private Set<Long> findTenantProjectIds(Long tenantId) {
        List<Project> projects = projectMapper.selectList(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getTenantId, tenantId)
                        .eq(Project::getDeleted, 0)
        );
        if (projects.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Long> projectIds = new LinkedHashSet<>();
        for (Project project : projects) {
            projectIds.add(project.getId());
        }
        return projectIds;
    }

    /**
     * 查询当前用户作为任务成员参与的任务 ID。
     *
     * @param currentUserId 当前用户 ID
     * @return 任务 ID 集合
     */
    private Set<Long> findMemberTaskIds(Long currentUserId) {
        List<ProjectTaskMember> memberRecords = projectTaskMemberMapper.selectList(
                new LambdaQueryWrapper<ProjectTaskMember>()
                        .eq(ProjectTaskMember::getUserId, currentUserId)
        );
        if (memberRecords.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Long> taskIds = new LinkedHashSet<>();
        for (ProjectTaskMember memberRecord : memberRecords) {
            taskIds.add(memberRecord.getTaskId());
        }
        return taskIds;
    }

    /**
     * 查询当前用户作为负责人的任务列表。
     *
     * @param currentUserId 当前用户 ID
     * @param tenantProjectIds 当前租户项目集合
     * @return 负责人任务列表
     */
    private List<ProjectTask> findAssigneeTasks(
            Long currentUserId,
            Collection<Long> tenantProjectIds) {
        if (tenantProjectIds.isEmpty()) {
            return Collections.emptyList();
        }
        return projectTaskMapper.selectList(
                new LambdaQueryWrapper<ProjectTask>()
                        .eq(ProjectTask::getAssigneeId, currentUserId)
                        .in(ProjectTask::getProjectId, tenantProjectIds)
                        .eq(ProjectTask::getDeleted, 0)
        );
    }

    /**
     * 收集当前周期真正需要展示的任务 ID。
     *
     * 日报按“任务 + 动态”共同驱动。
     * 周、月、年以任务变更为主，但对未完成任务若期间内有动态更新，也要纳入。
     *
     * @param tasks 参与任务列表
     * @param dynamics 周期动态列表
     * @param reportType 汇报类型
     * @param periodStart 周期开始
     * @param periodEnd 周期结束
     * @return 相关任务 ID
     */
    private Set<Long> collectRelevantTaskIds(
            List<ProjectTask> tasks,
            List<ProjectTaskDynamic> dynamics,
            String reportType,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {
        Set<Long> relevantTaskIds = new LinkedHashSet<>();
        Set<Long> dynamicTaskIds = new LinkedHashSet<>();
        for (ProjectTaskDynamic dynamic : dynamics) {
            dynamicTaskIds.add(dynamic.getTaskId());
        }

        for (ProjectTask task : tasks) {
            boolean taskTouchedInPeriod = isTaskTouchedInPeriod(
                    task,
                    periodStart,
                    periodEnd
            );
            if (taskTouchedInPeriod) {
                relevantTaskIds.add(task.getId());
                continue;
            }
            if ("daily".equals(reportType)
                    && dynamicTaskIds.contains(task.getId())) {
                relevantTaskIds.add(task.getId());
                continue;
            }
            boolean unfinishedTask = !FINISHED_STATUS_SET.contains(task.getStatus());
            if (!"daily".equals(reportType)
                    && unfinishedTask
                    && dynamicTaskIds.contains(task.getId())) {
                relevantTaskIds.add(task.getId());
            }
        }
        return relevantTaskIds;
    }

    /**
     * 过滤本次汇报允许展示的动态列表。
     *
     * 日报保留统计区间内全部参与任务动态。
     * 周、月、年只保留“未完成任务在统计区间内新增的动态”，避免动态噪声盖过任务主体。
     *
     * @param periodDynamics 周期动态列表
     * @param tasks 相关任务列表
     * @param relevantTaskIds 相关任务 ID
     * @param reportType 汇报类型
     * @return 过滤后的动态列表
     */
    private List<ProjectTaskDynamic> filterRelevantDynamics(
            List<ProjectTaskDynamic> periodDynamics,
            List<ProjectTask> tasks,
            Set<Long> relevantTaskIds,
            String reportType) {
        if (periodDynamics.isEmpty() || relevantTaskIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, ProjectTask> taskMap = new HashMap<>();
        for (ProjectTask task : tasks) {
            taskMap.put(task.getId(), task);
        }

        List<ProjectTaskDynamic> result = new ArrayList<>();
        for (ProjectTaskDynamic periodDynamic : periodDynamics) {
            if (!relevantTaskIds.contains(periodDynamic.getTaskId())) {
                continue;
            }
            if ("daily".equals(reportType)) {
                result.add(periodDynamic);
                continue;
            }
            ProjectTask task = taskMap.get(periodDynamic.getTaskId());
            if (task == null) {
                continue;
            }
            if (!FINISHED_STATUS_SET.contains(task.getStatus())) {
                result.add(periodDynamic);
            }
        }
        return result;
    }

    /**
     * 判断任务是否在统计区间内被直接更新过。
     *
     * @param task 任务实体
     * @param periodStart 周期开始
     * @param periodEnd 周期结束
     * @return 是否命中统计区间
     */
    private boolean isTaskTouchedInPeriod(
            ProjectTask task,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {
        if (isWithinPeriod(task.getUpdateTime(), periodStart, periodEnd)) {
            return true;
        }
        return isWithinPeriod(task.getCreateTime(), periodStart, periodEnd);
    }

    /**
     * 判断时间是否在统计区间内。
     *
     * @param value 时间值
     * @param periodStart 周期开始
     * @param periodEnd 周期结束
     * @return 是否命中
     */
    private boolean isWithinPeriod(
            LocalDateTime value,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {
        if (value == null) {
            return false;
        }
        if (value.isBefore(periodStart)) {
            return false;
        }
        return !value.isAfter(periodEnd);
    }

    /**
     * 构建任务排序器。
     *
     * @return 任务排序器
     */
    private Comparator<ProjectTask> buildTaskComparator() {
        return Comparator
                .comparing(
                        ProjectTask::getUpdateTime,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(
                        ProjectTask::getCreateTime,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(
                        ProjectTask::getId,
                        Comparator.nullsLast(Comparator.reverseOrder())
                );
    }

    /**
     * 获取项目名称映射。
     *
     * @param tasks 任务列表
     * @return 项目名称映射
     */
    private Map<Long, String> getProjectNameMap(List<ProjectTask> tasks) {
        if (tasks.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> projectIds = new LinkedHashSet<>();
        for (ProjectTask task : tasks) {
            projectIds.add(task.getProjectId());
        }
        List<Project> projects = projectMapper.selectBatchIds(projectIds);
        Map<Long, String> result = new LinkedHashMap<>();
        for (Project project : projects) {
            result.put(project.getId(), project.getName());
        }
        return result;
    }

    /**
     * 构建参与身份映射。
     *
     * @param tasks 任务列表
     * @param currentUserId 当前用户 ID
     * @param memberTaskIds 成员任务 ID 集合
     * @return 身份映射
     */
    private Map<Long, String> buildParticipationRoleMap(
            List<ProjectTask> tasks,
            Long currentUserId,
            Set<Long> memberTaskIds) {
        Map<Long, String> roleMap = new LinkedHashMap<>();
        for (ProjectTask task : tasks) {
            boolean assignee = currentUserId.equals(task.getAssigneeId());
            boolean member = memberTaskIds.contains(task.getId());
            if (assignee && member) {
                roleMap.put(task.getId(), "负责人、成员");
                continue;
            }
            if (assignee) {
                roleMap.put(task.getId(), "负责人");
                continue;
            }
            roleMap.put(task.getId(), "成员");
        }
        return roleMap;
    }

    /**
     * 构建每个任务最新动态摘要映射。
     *
     * @param dynamics 动态列表
     * @return 最新动态摘要映射
     */
    private Map<Long, String> buildLatestDynamicSummaryMap(
            List<ProjectTaskDynamic> dynamics) {
        if (dynamics.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> result = new LinkedHashMap<>();
        for (int index = dynamics.size() - 1; index >= 0; index--) {
            ProjectTaskDynamic dynamic = dynamics.get(index);
            if (!result.containsKey(dynamic.getTaskId())) {
                result.put(dynamic.getTaskId(), dynamic.getContent());
            }
        }
        return result;
    }

    /**
     * 获取动态发布人名称映射。
     *
     * @param dynamics 动态列表
     * @return 用户名称映射
     */
    private Map<Long, String> getOperatorNameMap(
            List<ProjectTaskDynamic> dynamics) {
        if (dynamics.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> operatorIds = new HashSet<>();
        for (ProjectTaskDynamic dynamic : dynamics) {
            if (dynamic.getOperatorId() != null) {
                operatorIds.add(dynamic.getOperatorId());
            }
        }
        if (operatorIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(
                operatorIds
        );
        Map<Long, String> result = new LinkedHashMap<>();
        for (Long operatorId : operatorIds) {
            AuthUserSimpleDto user = userMap.get(operatorId);
            if (user == null || !StringUtils.hasText(user.getNickname())) {
                result.put(operatorId, "用户#" + operatorId);
                continue;
            }
            result.put(operatorId, user.getNickname().trim());
        }
        return result;
    }

    /**
     * 构建任务汇报项。
     *
     * @param tasks 任务列表
     * @param projectNameMap 项目名称映射
     * @param taskRoleMap 参与身份映射
     * @param latestDynamicSummaryMap 最新动态摘要映射
     * @return 任务汇报项列表
     */
    private List<ProjectTaskWorkReportTaskDto> buildTaskDtos(
            List<ProjectTask> tasks,
            Map<Long, String> projectNameMap,
            Map<Long, String> taskRoleMap,
            Map<Long, String> latestDynamicSummaryMap) {
        if (tasks.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProjectTaskWorkReportTaskDto> result = new ArrayList<>();
        for (ProjectTask task : tasks) {
            result.add(ProjectTaskWorkReportTaskDto.builder()
                    .id(task.getId())
                    .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                    .title(task.getTitle())
                    .participationRole(taskRoleMap.getOrDefault(task.getId(), "成员"))
                    .status(task.getStatus())
                    .priority(task.getPriority())
                    .updatedAt(formatDateTime(task.getUpdateTime()))
                    .latestDynamicSummary(
                            latestDynamicSummaryMap.getOrDefault(task.getId(), "")
                    )
                    .build());
        }
        return result;
    }

    /**
     * 构建动态汇报项。
     *
     * @param dynamics 动态列表
     * @param tasks 任务列表
     * @param projectNameMap 项目名称映射
     * @param operatorNameMap 发布人名称映射
     * @return 动态汇报项列表
     */
    private List<ProjectTaskWorkReportDynamicDto> buildDynamicDtos(
            List<ProjectTaskDynamic> dynamics,
            List<ProjectTask> tasks,
            Map<Long, String> projectNameMap,
            Map<Long, String> operatorNameMap) {
        if (dynamics.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, ProjectTask> taskMap = new LinkedHashMap<>();
        for (ProjectTask task : tasks) {
            taskMap.put(task.getId(), task);
        }
        List<ProjectTaskWorkReportDynamicDto> result = new ArrayList<>();
        for (ProjectTaskDynamic dynamic : dynamics) {
            ProjectTask task = taskMap.get(dynamic.getTaskId());
            if (task == null) {
                continue;
            }
            result.add(ProjectTaskWorkReportDynamicDto.builder()
                    .taskId(dynamic.getTaskId())
                    .projectName(projectNameMap.getOrDefault(task.getProjectId(), ""))
                    .taskTitle(task.getTitle())
                    .operatorName(
                            operatorNameMap.getOrDefault(
                                    dynamic.getOperatorId(),
                                    ""
                            )
                    )
                    .createdAt(formatDateTime(dynamic.getCreateTime()))
                    .content(dynamic.getContent())
                    .build());
        }
        return result;
    }

    /**
     * 构建汇报标题。
     *
     * @param reportType 汇报类型
     * @param referenceDate 参考日期
     * @return 汇报标题
     */
    private String buildReportTitle(
            String reportType,
            LocalDate referenceDate) {
        if ("daily".equals(reportType)) {
            return "日报（" + DATE_FORMATTER.format(referenceDate) + "）";
        }
        if ("weekly".equals(reportType)) {
            LocalDate startDate = referenceDate.with(
                    TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)
            );
            LocalDate endDate = referenceDate.with(
                    TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)
            );
            return "周报（" + DATE_FORMATTER.format(startDate)
                    + " ~ " + DATE_FORMATTER.format(endDate) + "）";
        }
        if ("monthly".equals(reportType)) {
            return "月报（" + referenceDate.getYear()
                    + "年" + referenceDate.getMonthValue() + "月）";
        }
        return "年报（" + referenceDate.getYear() + "年）";
    }

    /**
     * 校验当前租户 ID。
     *
     * @param currentUser 当前登录用户
     * @return 租户 ID
     */
    private Long requireCurrentTenantId(AuthCurrentUserDto currentUser) {
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED.value(),
                    "当前登录用户未绑定租户"
            );
        }
        return tenantId;
    }

    /**
     * 格式化时间。
     *
     * @param value 时间值
     * @return 时间文本
     */
    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(value);
    }
}
