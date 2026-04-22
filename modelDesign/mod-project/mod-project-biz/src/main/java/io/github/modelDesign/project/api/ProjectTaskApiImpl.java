package io.github.modelDesign.project.api;

import io.github.modelDesign.project.api.dto.MyTodoTaskDto;
import io.github.modelDesign.project.api.dto.PageResult;
import io.github.modelDesign.project.api.dto.ProjectTaskCompleteCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskCreateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskDto;
import io.github.modelDesign.project.api.dto.ProjectTaskMyTodoRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskQueryRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskStatusUpdateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskTypeDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.request.ProjectTaskDynamicCreateRequest;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.request.ProjectTaskCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import io.github.modelDesign.project.request.ProjectTaskListRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import io.github.modelDesign.project.response.ProjectTaskTypeVo;
import io.github.modelDesign.project.service.ProjectTaskDynamicService;
import io.github.modelDesign.project.service.ProjectTaskService;
import io.github.modelDesign.project.service.ProjectTaskWorkReportService;
import io.github.modelDesign.project.service.TaskTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 项目任务对外接口实现。
 *
 * 这里单独封装一层 API 适配，避免 ai 模块直接依赖
 * project 业务模块的 Controller 请求对象与视图对象。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskApiImpl implements ProjectTaskApi {
    /**
     * 与 HTTP 接口保持一致的时间格式。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 项目任务服务。
     */
    private final ProjectTaskService projectTaskService;

    /**
     * 任务动态服务。
     */
    private final ProjectTaskDynamicService projectTaskDynamicService;

    /**
     * 任务类型服务。
     */
    private final TaskTypeService taskTypeService;

    /**
     * 工作汇报服务。
     */
    private final ProjectTaskWorkReportService projectTaskWorkReportService;

    /**
     * 查询任务列表。
     *
     * @param request 查询条件
     * @return 分页结果
     */
    @Override
    public PageResult<ProjectTaskDto> queryTasks(ProjectTaskQueryRequest request) {
        ProjectTaskListRequest serviceRequest = new ProjectTaskListRequest();
        serviceRequest.setProjectId(request.getProjectId());
        serviceRequest.setCurrent(request.getCurrent());
        serviceRequest.setPageSize(request.getPageSize());
        serviceRequest.setTitle(request.getTitle());
        serviceRequest.setTypeId(request.getTypeId());
        serviceRequest.setStatus(request.getStatus());
        serviceRequest.setPriority(request.getPriority());
        serviceRequest.setAssigneeId(normalizeNullableId(request.getAssigneeId()));
        serviceRequest.setSortField(request.getSortField());
        serviceRequest.setSortOrder(request.getSortOrder());

        PageResponse<ProjectTaskDetailVo> response =
                projectTaskService.getList(serviceRequest);
        return new PageResult<>(toTaskDtoList(response.getItems()), response.getTotal());
    }

    /**
     * 查询任务类型。
     *
     * @param name 类型名称关键字
     * @return 类型列表
     */
    @Override
    public List<ProjectTaskTypeDto> queryTaskTypes(String name) {
        ProjectTaskTypeListRequest request = new ProjectTaskTypeListRequest();
        request.setName(name);
        List<ProjectTaskTypeVo> items = taskTypeService.getList(request);
        List<ProjectTaskTypeDto> result = new ArrayList<>();
        for (ProjectTaskTypeVo item : items) {
            result.add(ProjectTaskTypeDto.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .sort(item.getSort())
                    .build());
        }
        return result;
    }

    /**
     * 按任务编号获取详情。
     *
     * @param code 任务编号
     * @return 任务详情
     */
    @Override
    public ProjectTaskDto getTaskDetailByCode(String code) {
        ProjectTaskDetailVo task = projectTaskService.getDetailByCode(code);
        return toTaskDto(task);
    }

    /**
     * 获取任务详情。
     *
     * @param taskId 任务 ID
     * @return 任务详情
     */
    @Override
    public ProjectTaskDto getTaskDetail(Long taskId) {
        ProjectTaskDetailVo task = projectTaskService.getDetail(taskId);
        return toTaskDto(task);
    }

    /**
     * 创建任务。
     *
     * @param command 创建命令
     * @return 创建后的任务
     */
    @Override
    public ProjectTaskDto createTask(ProjectTaskCreateCommand command) {
        ProjectTaskCreateRequest serviceRequest = new ProjectTaskCreateRequest();
        serviceRequest.setProjectId(command.getProjectId());
        serviceRequest.setParentTaskId(command.getParentTaskId());
        serviceRequest.setTitle(command.getTitle());
        serviceRequest.setDescription(command.getDescription());
        serviceRequest.setTypeId(command.getTypeId());
        serviceRequest.setStatus(command.getStatus());
        serviceRequest.setPriority(command.getPriority());
        serviceRequest.setWorkDays(command.getWorkDays());
        serviceRequest.setAssigneeId(normalizeNullableId(command.getAssigneeId()));
        serviceRequest.setStartTime(command.getStartTime());
        serviceRequest.setDueTime(command.getDueTime());

        ProjectTaskDetailVo task = projectTaskService.create(serviceRequest);
        return toTaskDto(task);
    }

    /**
     * 完成任务。
     *
     * 这里把“状态推进到待测试”和“补充开发完成动态”放在同一事务中，
     * 避免出现状态已更新但动态缺失的中间态。
     *
     * @param command 完成任务命令
     * @return 更新后的任务
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskDto completeTask(ProjectTaskCompleteCommand command) {
        ProjectTaskDto updatedTask = updateTaskStatusToPendingTest(command);

        ProjectTaskDynamicCreateRequest dynamicRequest =
                new ProjectTaskDynamicCreateRequest();
        dynamicRequest.setTaskId(command.getTaskId());
        dynamicRequest.setContent(buildCompletionDynamicContent(
                command.getCompletionSummary()
        ));
        dynamicRequest.setMentionedUserIds(command.getMentionedUserIds());
        projectTaskDynamicService.create(dynamicRequest);
        return updatedTask;
    }

    /**
     * 更新任务状态。
     *
     * 现有 project 写接口只有完整编辑入口，因此这里先取详情，
     * 再用原字段回填编辑请求，只覆盖目标状态，保证 HTTP 行为保持一致。
     *
     * @param command 状态更新命令
     * @return 更新后的任务
     */
    @Override
    public ProjectTaskDto updateTaskStatus(ProjectTaskStatusUpdateCommand command) {
        ProjectTaskDetailVo currentTask =
                projectTaskService.getDetail(command.getTaskId());

        ProjectTaskEditRequest serviceRequest = new ProjectTaskEditRequest();
        serviceRequest.setParentTaskId(currentTask.getParentTaskId());
        serviceRequest.setPredecessorTaskIds(currentTask.getPredecessorTaskIds());
        serviceRequest.setTagIds(currentTask.getTagIds());
        serviceRequest.setTitle(currentTask.getTitle());
        serviceRequest.setDescription(currentTask.getDescription());
        serviceRequest.setTypeId(currentTask.getTypeId());
        serviceRequest.setStatus(command.getStatus());
        serviceRequest.setPriority(currentTask.getPriority());
        serviceRequest.setWorkDays(currentTask.getWorkDays());
        serviceRequest.setAssigneeId(normalizeNullableId(currentTask.getAssigneeId()));
        serviceRequest.setStartTime(parseDateTime(currentTask.getStartTime()));
        serviceRequest.setDueTime(parseDateTime(currentTask.getDueTime()));

        ProjectTaskDetailVo updatedTask = projectTaskService.edit(
                command.getTaskId(),
                serviceRequest
        );
        return toTaskDto(updatedTask);
    }

    /**
     * 查询我的待办。
     *
     * @param request 查询条件
     * @return 分页结果
     */
    @Override
    public PageResult<MyTodoTaskDto> queryMyTodo(ProjectTaskMyTodoRequest request) {
        MyTodoListRequest serviceRequest = new MyTodoListRequest();
        serviceRequest.setCurrent(request.getCurrent());
        serviceRequest.setPageSize(request.getPageSize());
        serviceRequest.setTitle(request.getTitle());
        serviceRequest.setPriority(request.getPriority());
        serviceRequest.setStatus(request.getStatus());

        PageResponse<MyTodoItemVo> response =
                projectTaskService.getMyTodoList(serviceRequest);
        return new PageResult<>(
                toMyTodoDtoList(response.getItems()),
                response.getTotal()
        );
    }

    /**
     * 生成当前登录用户的工作汇报。
     *
     * @param command 汇报查询命令
     * @return 汇报结果
     */
    @Override
    public ProjectTaskWorkReportDto generateWorkReport(
            ProjectTaskWorkReportCommand command) {
        return projectTaskWorkReportService.generateCurrentUserReport(command);
    }

    private List<ProjectTaskDto> toTaskDtoList(List<ProjectTaskDetailVo> items) {
        List<ProjectTaskDto> result = new ArrayList<>();
        if (items == null || items.isEmpty()) {
            return result;
        }
        for (ProjectTaskDetailVo item : items) {
            result.add(toTaskDto(item));
        }
        return result;
    }

    private List<MyTodoTaskDto> toMyTodoDtoList(List<MyTodoItemVo> items) {
        List<MyTodoTaskDto> result = new ArrayList<>();
        if (items == null || items.isEmpty()) {
            return result;
        }
        for (MyTodoItemVo item : items) {
            result.add(toMyTodoDto(item));
        }
        return result;
    }

    private ProjectTaskDto toTaskDto(ProjectTaskDetailVo item) {
        return ProjectTaskDto.builder()
                .id(item.getId())
                .projectId(item.getProjectId())
                .projectName(item.getProjectName())
                .parentTaskId(item.getParentTaskId())
                .title(item.getTitle())
                .description(item.getDescription())
                .latestDynamicSummary(item.getLatestDynamicSummary())
                .typeId(item.getTypeId())
                .typeName(item.getTypeName())
                .status(item.getStatus())
                .priority(item.getPriority())
                .canStart(item.getCanStart())
                .blockedReason(item.getBlockedReason())
                .workDays(item.getWorkDays())
                .assigneeId(item.getAssigneeId())
                .assigneeName(item.getAssignee())
                .creatorId(item.getCreatorId())
                .creatorName(item.getCreator())
                .startTime(item.getStartTime())
                .dueTime(item.getDueTime())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private MyTodoTaskDto toMyTodoDto(MyTodoItemVo item) {
        return MyTodoTaskDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .latestDynamicSummary(item.getLatestDynamicSummary())
                .receivedAt(item.getReceivedAt())
                .priority(item.getPriority())
                .workDays(item.getWorkDays())
                .status(item.getStatus())
                .initiatorName(item.getInitiatorName())
                .projectId(item.getProjectId())
                .projectName(item.getProjectName())
                .build();
    }

    private Long normalizeNullableId(Long id) {
        if (id == null) {
            return null;
        }
        if (id == 0L) {
            return null;
        }
        return id;
    }

    private LocalDateTime parseDateTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return LocalDateTime.parse(value, DATE_TIME_FORMATTER);
    }

    /**
     * 构造完成任务时的动态文案。
     *
     * @param completionSummary 开发完成总结
     * @return 动态内容
     */
    private String buildCompletionDynamicContent(String completionSummary) {
        String prefix = "开发已完成，待发布测试。";
        if (!StringUtils.hasText(completionSummary)) {
            return prefix;
        }
        return prefix + System.lineSeparator()
                + "开发总结：" + completionSummary.trim();
    }

    /**
     * 把任务推进到待测试状态。
     *
     * @param command 完成任务命令
     * @return 更新后的任务
     */
    private ProjectTaskDto updateTaskStatusToPendingTest(
            ProjectTaskCompleteCommand command) {
        ProjectTaskStatusUpdateCommand statusUpdateCommand =
                new ProjectTaskStatusUpdateCommand();
        statusUpdateCommand.setTaskId(command.getTaskId());
        statusUpdateCommand.setStatus("pendingTest");
        return updateTaskStatus(statusUpdateCommand);
    }
}
