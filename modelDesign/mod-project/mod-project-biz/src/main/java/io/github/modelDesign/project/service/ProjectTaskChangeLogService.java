package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskChangeLog;
import io.github.modelDesign.project.enums.ProjectTaskChangeOperationTypeEnum;
import io.github.modelDesign.project.mapper.ProjectTaskChangeLogMapper;
import io.github.modelDesign.project.request.ProjectTaskChangeLogListRequest;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskChangeItemVo;
import io.github.modelDesign.project.response.ProjectTaskChangeLogItemVo;
import io.github.modelDesign.project.response.TaskStatusConfigVo;
import io.github.modelDesign.project.support.ProjectTaskChangeContentItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 任务变更日志服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskChangeLogService extends ServiceImpl<ProjectTaskChangeLogMapper, ProjectTaskChangeLog>
        implements IService<ProjectTaskChangeLog> {
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
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 记录任务创建日志。
     *
     * @param task 任务实体
     */
    public void logCreate(ProjectTask task) {
        List<ProjectTaskChangeContentItem> changes = new ArrayList<>();
        changes.add(buildChangeItem("title", "任务标题", "-", formatText(task.getTitle())));
        changes.add(buildChangeItem("description", "任务描述", "-", formatText(task.getDescription())));
        changes.add(buildChangeItem("status", "任务状态", "-", formatStatus(task.getStatus())));
        changes.add(buildChangeItem("priority", "任务优先级", "-", formatPriority(task.getPriority())));
        changes.add(buildChangeItem("workDays", "预计工时", "-", formatWorkDays(task.getWorkDays())));
        changes.add(buildChangeItem("assigneeId", "负责人", "-", formatUser(task.getAssigneeId())));
        changes.add(buildChangeItem("startTime", "开始时间", "-", formatDateTime(task.getStartTime())));
        changes.add(buildChangeItem("dueTime", "截止时间", "-", formatDateTime(task.getDueTime())));
        saveLog(task.getId(), ProjectTaskChangeOperationTypeEnum.CREATE, changes);
    }

    /**
     * 记录任务更新日志。
     *
     * @param beforeTask 变更前任务
     * @param afterTask  变更后任务
     */
    public void logUpdate(ProjectTask beforeTask, ProjectTask afterTask) {
        List<ProjectTaskChangeContentItem> changes = new ArrayList<>();
        appendChangeIfChanged(changes, "title", "任务标题", formatText(beforeTask.getTitle()), formatText(afterTask.getTitle()));
        appendChangeIfChanged(changes, "description", "任务描述", formatText(beforeTask.getDescription()), formatText(afterTask.getDescription()));
        appendChangeIfChanged(changes, "status", "任务状态", formatStatus(beforeTask.getStatus()), formatStatus(afterTask.getStatus()));
        appendChangeIfChanged(changes, "priority", "任务优先级", formatPriority(beforeTask.getPriority()), formatPriority(afterTask.getPriority()));
        appendChangeIfChanged(changes, "workDays", "预计工时", formatWorkDays(beforeTask.getWorkDays()), formatWorkDays(afterTask.getWorkDays()));
        appendChangeIfChanged(changes, "assigneeId", "负责人", formatUser(beforeTask.getAssigneeId()), formatUser(afterTask.getAssigneeId()));
        appendChangeIfChanged(changes, "startTime", "开始时间", formatDateTime(beforeTask.getStartTime()), formatDateTime(afterTask.getStartTime()));
        appendChangeIfChanged(changes, "dueTime", "截止时间", formatDateTime(beforeTask.getDueTime()), formatDateTime(afterTask.getDueTime()));
        if (changes.isEmpty()) {
            return;
        }
        saveLog(afterTask.getId(), ProjectTaskChangeOperationTypeEnum.UPDATE, changes);
    }

    /**
     * 记录任务删除日志。
     *
     * @param task 任务实体
     */
    public void logDelete(ProjectTask task) {
        saveLog(task.getId(), ProjectTaskChangeOperationTypeEnum.DELETE, Collections.emptyList());
    }

    /**
     * 记录添加任务成员日志。
     *
     * @param taskId   任务 ID
     * @param userIds  用户 ID 列表
     */
    public void logMemberAdd(Long taskId, Collection<Long> userIds) {
        String memberText = formatUserList(userIds);
        if ("-".equals(memberText)) {
            return;
        }
        List<ProjectTaskChangeContentItem> changes = List.of(
                buildChangeItem("members", "任务成员", "-", memberText)
        );
        saveLog(taskId, ProjectTaskChangeOperationTypeEnum.MEMBER_ADD, changes);
    }

    /**
     * 记录移除任务成员日志。
     *
     * @param taskId  任务 ID
     * @param userIds 用户 ID 列表
     */
    public void logMemberRemove(Long taskId, Collection<Long> userIds) {
        String memberText = formatUserList(userIds);
        if ("-".equals(memberText)) {
            return;
        }
        List<ProjectTaskChangeContentItem> changes = List.of(
                buildChangeItem("members", "任务成员", memberText, "-")
        );
        saveLog(taskId, ProjectTaskChangeOperationTypeEnum.MEMBER_REMOVE, changes);
    }

    /**
     * 记录任务关系变更日志。
     *
     * @param taskId               任务 ID
     * @param beforeParentTaskId   变更前父任务 ID
     * @param afterParentTaskId    变更后父任务 ID
     * @param beforePredecessorIds 变更前前置任务 ID 列表
     * @param afterPredecessorIds  变更后前置任务 ID 列表
     */
    public void logRelationUpdate(
            Long taskId,
            Long beforeParentTaskId,
            Long afterParentTaskId,
            Collection<Long> beforePredecessorIds,
            Collection<Long> afterPredecessorIds) {
        List<ProjectTaskChangeContentItem> changes = new ArrayList<>();
        appendChangeIfChanged(changes, "parentTaskId", "父任务", formatId(beforeParentTaskId), formatId(afterParentTaskId));
        appendChangeIfChanged(changes, "predecessorTaskIds", "前置任务", formatIdList(beforePredecessorIds), formatIdList(afterPredecessorIds));
        if (changes.isEmpty()) {
            return;
        }
        saveLog(taskId, ProjectTaskChangeOperationTypeEnum.RELATION_UPDATE, changes);
    }

    /**
     * 记录任务标签绑定变更日志。
     *
     * @param taskId       任务 ID
     * @param beforeTagIds 变更前标签 ID 列表
     * @param afterTagIds  变更后标签 ID 列表
     */
    public void logTagBindingUpdate(Long taskId, Collection<Long> beforeTagIds, Collection<Long> afterTagIds) {
        String beforeText = formatIdList(beforeTagIds);
        String afterText = formatIdList(afterTagIds);
        if (Objects.equals(beforeText, afterText)) {
            return;
        }
        List<ProjectTaskChangeContentItem> changes = List.of(
                buildChangeItem("tagIds", "任务标签", beforeText, afterText)
        );
        saveLog(taskId, ProjectTaskChangeOperationTypeEnum.TAG_BINDING_UPDATE, changes);
    }

    /**
     * 记录任务自动完成日志。
     *
     * @param beforeTask 变更前任务
     * @param afterTask  变更后任务
     */
    public void logAutoComplete(ProjectTask beforeTask, ProjectTask afterTask) {
        List<ProjectTaskChangeContentItem> changes = new ArrayList<>();
        appendChangeIfChanged(changes, "status", "任务状态", formatStatus(beforeTask.getStatus()), formatStatus(afterTask.getStatus()));
        if (changes.isEmpty()) {
            return;
        }
        saveLog(afterTask.getId(), ProjectTaskChangeOperationTypeEnum.AUTO_COMPLETE, changes);
    }

    /**
     * 记录依赖就绪通知日志。
     *
     * @param taskId            任务 ID
     * @param predecessorTaskIds 触发就绪的前置任务 ID 列表
     */
    public void logDependencyReady(Long taskId, Collection<Long> predecessorTaskIds) {
        List<ProjectTaskChangeContentItem> changes = List.of(
                buildChangeItem("predecessorTaskIds", "前置任务", "-", formatIdList(predecessorTaskIds))
        );
        saveLog(taskId, ProjectTaskChangeOperationTypeEnum.DEPENDENCY_READY, changes);
    }

    /**
     * 获取任务变更日志列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<ProjectTaskChangeLogItemVo> getList(ProjectTaskChangeLogListRequest request) {
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        List<ProjectTaskChangeLog> allLogs = lambdaQuery()
                .eq(ProjectTaskChangeLog::getTaskId, request.getTaskId())
                .orderByDesc(ProjectTaskChangeLog::getCreateTime)
                .list();
        long total = allLogs.size();
        long fromIndex = Math.max((current - 1L) * pageSize, 0L);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTaskChangeLog> pageLogs = allLogs.subList((int) fromIndex, (int) toIndex);
        return new PageResponse<>(toLogVoList(pageLogs), total);
    }

    private void saveLog(Long taskId, ProjectTaskChangeOperationTypeEnum operationType, List<ProjectTaskChangeContentItem> changes) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        ProjectTaskChangeLog changeLog = new ProjectTaskChangeLog();
        changeLog.setTaskId(taskId);
        changeLog.setOperationType(operationType.getCode());
        changeLog.setOperatorId(currentUser.getUserId());
        changeLog.setContent(changes);
        save(changeLog);
    }

    private List<ProjectTaskChangeLogItemVo> toLogVoList(List<ProjectTaskChangeLog> logs) {
        Set<Long> operatorIds = logs.stream()
                .map(ProjectTaskChangeLog::getOperatorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> operatorNameMap = getOperatorNameMap(operatorIds);
        List<ProjectTaskChangeLogItemVo> result = new ArrayList<>();
        for (ProjectTaskChangeLog log : logs) {
            ProjectTaskChangeOperationTypeEnum operationType = ProjectTaskChangeOperationTypeEnum.fromCode(log.getOperationType());
            result.add(ProjectTaskChangeLogItemVo.builder()
                    .id(log.getId())
                    .taskId(log.getTaskId())
                    .operationType(log.getOperationType())
                    .operationText(operationType.getText())
                    .operatorId(log.getOperatorId())
                    .operatorName(operatorNameMap.getOrDefault(log.getOperatorId(), "-"))
                    .createdAt(formatDateTime(log.getCreateTime()))
                    .changes(toChangeItemVoList(log.getContent()))
                    .build());
        }
        return result;
    }

    private List<ProjectTaskChangeItemVo> toChangeItemVoList(List<ProjectTaskChangeContentItem> contentItems) {
        if (contentItems == null || contentItems.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProjectTaskChangeItemVo> result = new ArrayList<>();
        for (ProjectTaskChangeContentItem item : contentItems) {
            result.add(ProjectTaskChangeItemVo.builder()
                    .field(item.getField())
                    .label(item.getLabel())
                    .beforeValue(item.getBeforeValue())
                    .afterValue(item.getAfterValue())
                    .build());
        }
        return result;
    }

    private Map<Long, String> getOperatorNameMap(Set<Long> operatorIds) {
        if (operatorIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(operatorIds);
        Map<Long, String> result = new LinkedHashMap<>();
        for (Map.Entry<Long, AuthUserSimpleDto> entry : userMap.entrySet()) {
            String nickname = "-";
            AuthUserSimpleDto user = entry.getValue();
            if (user != null && StringUtils.hasText(user.getNickname())) {
                nickname = user.getNickname().trim();
            } else if (entry.getKey() != null) {
                nickname = "用户#" + entry.getKey();
            }
            result.put(entry.getKey(), nickname);
        }
        return result;
    }

    private void appendChangeIfChanged(List<ProjectTaskChangeContentItem> changes, String field, String label, String beforeValue, String afterValue) {
        if (Objects.equals(beforeValue, afterValue)) {
            return;
        }
        changes.add(buildChangeItem(field, label, beforeValue, afterValue));
    }

    private ProjectTaskChangeContentItem buildChangeItem(String field, String label, String beforeValue, String afterValue) {
        return new ProjectTaskChangeContentItem(field, label, beforeValue, afterValue);
    }

    private String formatText(String value) {
        if (!StringUtils.hasText(value)) {
            return "-";
        }
        return value.trim();
    }

    private String formatStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "-";
        }
        Map<String, String> statusNameMap = new HashMap<>();
        List<TaskStatusConfigVo> statusConfigs = taskStatusConfigService.getList();
        for (TaskStatusConfigVo statusConfig : statusConfigs) {
            statusNameMap.put(statusConfig.getCode(), statusConfig.getName());
        }
        String text = statusNameMap.get(status);
        if (StringUtils.hasText(text)) {
            return text;
        }
        return status;
    }

    private String formatPriority(String priority) {
        if (!StringUtils.hasText(priority)) {
            return "-";
        }
        if ("high".equals(priority)) {
            return "高";
        }
        if ("medium".equals(priority)) {
            return "中";
        }
        if ("low".equals(priority)) {
            return "低";
        }
        return priority;
    }

    private String formatWorkDays(BigDecimal workDays) {
        if (workDays == null) {
            return "-";
        }
        BigDecimal normalizedValue = workDays.stripTrailingZeros();
        return normalizedValue.toPlainString() + " 人天";
    }

    private String formatUser(Long userId) {
        if (userId == null || userId.equals(0L)) {
            return "-";
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(Set.of(userId));
        AuthUserSimpleDto user = userMap.get(userId);
        if (user == null) {
            return "用户#" + userId;
        }
        if (StringUtils.hasText(user.getNickname())) {
            return user.getNickname().trim();
        }
        return "用户#" + userId;
    }

    private String formatUserList(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return "-";
        }
        Set<Long> normalizedUserIds = userIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (normalizedUserIds.isEmpty()) {
            return "-";
        }
        Map<Long, AuthUserSimpleDto> userMap = authUserApi.getUserMapByIds(normalizedUserIds);
        List<String> names = new ArrayList<>();
        for (Long userId : normalizedUserIds) {
            AuthUserSimpleDto user = userMap.get(userId);
            if (user != null && StringUtils.hasText(user.getNickname())) {
                names.add(user.getNickname().trim());
            } else {
                names.add("用户#" + userId);
            }
        }
        return String.join("、", names);
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "-";
        }
        return DATE_TIME_FORMATTER.format(value);
    }

    private String formatId(Long id) {
        if (id == null || id <= 0) {
            return "-";
        }
        return "#" + id;
    }

    private String formatIdList(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return "-";
        }
        Set<Long> normalizedIds = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null || id <= 0) {
                continue;
            }
            normalizedIds.add(id);
        }
        if (normalizedIds.isEmpty()) {
            return "-";
        }
        List<String> idTexts = new ArrayList<>();
        for (Long id : normalizedIds) {
            idTexts.add("#" + id);
        }
        return String.join("、", idTexts);
    }
}
