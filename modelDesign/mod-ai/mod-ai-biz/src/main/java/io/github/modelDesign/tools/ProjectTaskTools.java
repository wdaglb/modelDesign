package io.github.modelDesign.tools;

import io.github.modelDesign.project.api.ProjectTaskApi;
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
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDynamicDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportTaskDto;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * 面向 AI 的任务工具集合。
 *
 * 这里按 Spring AI Tools 文档提供具名方法，
 * 让模型通过结构化参数安全调用 project 公共 API。
 */
@Component
@ConditionalOnProperty(
        prefix = "model-design.ai.mcp",
        name = "enabled",
        havingValue = "true"
)
@RequiredArgsConstructor
public class ProjectTaskTools {
    /**
     * 文本时间格式。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 分支 slug 的最大长度。
     */
    private static final int MAX_BRANCH_SLUG_LENGTH = 48;

    /**
     * 任务对外接口。
     */
    private final ProjectTaskApi projectTaskApi;

    /**
     * 查询项目任务列表。
     *
     * @param projectId 项目 ID
     * @param current 当前页
     * @param pageSize 每页条数
     * @param title 标题关键字
     * @param typeId 类型 ID
     * @param status 状态编码
     * @param priority 优先级
     * @param assigneeId 负责人 ID
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 分页结果
     */
    @Tool(
            name = "queryProjectTasks",
            description = "查询项目任务列表。适用于根据项目ID、标题、类型、"
                    + "状态、优先级、负责人和排序方式筛选任务。"
    )
    public PageResult<ProjectTaskDto> queryProjectTasks(
            @ToolParam(description = "项目ID") Long projectId,
            @ToolParam(required = false, description = "当前页码，默认 1")
            Integer current,
            @ToolParam(required = false, description = "每页条数，默认 10")
            Integer pageSize,
            @ToolParam(required = false, description = "任务标题关键字")
            String title,
            @ToolParam(required = false, description = "任务类型ID")
            Long typeId,
            @ToolParam(
                    required = false,
                    description = "任务状态编码，可选 todo、inProgress、"
                            + "pendingTest、pendingRelease、done、canceled"
            )
            String status,
            @ToolParam(
                    required = false,
                    description = "任务优先级，可选 low、medium、high"
            )
            String priority,
            @ToolParam(required = false, description = "负责人用户ID")
            Long assigneeId,
            @ToolParam(
                    required = false,
                    description = "排序字段，可选 priority、startTime"
            )
            String sortField,
            @ToolParam(
                    required = false,
                    description = "排序方向，可选 asc、desc"
            )
            String sortOrder) {
        ProjectTaskQueryRequest request = new ProjectTaskQueryRequest();
        request.setProjectId(projectId);
        request.setCurrent(resolvePageNumber(current));
        request.setPageSize(resolvePageSize(pageSize));
        request.setTitle(title);
        request.setTypeId(typeId);
        request.setStatus(status);
        request.setPriority(priority);
        request.setAssigneeId(assigneeId);
        request.setSortField(sortField);
        request.setSortOrder(sortOrder);
        return projectTaskApi.queryTasks(request);
    }

    /**
     * 查询任务类型列表。
     *
     * @param name 类型名称关键字
     * @return 类型列表
     */
    @Tool(
            name = "queryProjectTaskTypes",
            description = "查询当前租户可用的任务类型列表。"
                    + "适合先查询 typeId，再调用创建任务工具。"
    )
    public List<ProjectTaskTypeDto> queryProjectTaskTypes(
            @ToolParam(required = false, description = "任务类型名称关键字")
            String name) {
        return projectTaskApi.queryTaskTypes(name);
    }

    /**
     * 按任务编号查询详情。
     *
     * @param code 任务编号，可传 TASK-2048、项目编号前缀编号或纯数字
     * @return 任务详情
     */
    @Tool(
            name = "getProjectTaskDetailByCode",
            description = "按任务编号查询任务详情。支持 TASK-2048、"
                    + "项目编号前缀编号以及纯数字编号。"
    )
    public ProjectTaskDto getProjectTaskDetailByCode(
            @ToolParam(
                    description = "任务编号，例如 TASK-2048、DEMO-2048 或 2048"
            )
            String code) {
        return projectTaskApi.getTaskDetailByCode(code);
    }

    /**
     * 创建任务。
     *
     * @param projectId 项目 ID
     * @param title 标题
     * @param typeId 类型 ID
     * @param status 状态
     * @param priority 优先级
     * @param description 描述
     * @param assigneeId 负责人 ID
     * @param workDays 预计工时
     * @param startTime 开始时间
     * @param dueTime 截止时间
     * @param parentTaskId 父任务 ID
     * @return 创建后的任务
     */
    @Tool(
            name = "createProjectTask",
            description = "创建项目任务。至少需要项目ID、标题、类型ID、"
                    + "状态和优先级，其余字段按需补充。"
    )
    public ProjectTaskDto createProjectTask(
            @ToolParam(description = "项目ID") Long projectId,
            @ToolParam(description = "任务标题") String title,
            @ToolParam(description = "任务类型ID") Long typeId,
            @ToolParam(
                    description = "任务状态编码，可选 todo、inProgress、"
                            + "pendingTest、pendingRelease、done、canceled"
            )
            String status,
            @ToolParam(
                    description = "任务优先级，可选 low、medium、high"
            )
            String priority,
            @ToolParam(required = false, description = "任务描述")
            String description,
            @ToolParam(required = false, description = "负责人用户ID，0 表示未分配")
            Long assigneeId,
            @ToolParam(required = false, description = "预计工时，单位人天")
            BigDecimal workDays,
            @ToolParam(
                    required = false,
                    description = "开始时间，格式 yyyy-MM-dd HH:mm:ss"
            )
            String startTime,
            @ToolParam(
                    required = false,
                    description = "截止时间，格式 yyyy-MM-dd HH:mm:ss"
            )
            String dueTime,
            @ToolParam(required = false, description = "父任务ID")
            Long parentTaskId) {
        ProjectTaskCreateCommand command = new ProjectTaskCreateCommand();
        command.setProjectId(projectId);
        command.setTitle(title);
        command.setTypeId(typeId);
        command.setStatus(status);
        command.setPriority(priority);
        command.setDescription(description);
        command.setAssigneeId(assigneeId);
        command.setWorkDays(workDays);
        command.setStartTime(parseDateTime(startTime));
        command.setDueTime(parseDateTime(dueTime));
        command.setParentTaskId(parentTaskId);
        return projectTaskApi.createTask(command);
    }

    /**
     * 更新任务状态。
     *
     * @param taskId 任务 ID
     * @param status 状态编码
     * @return 更新后的任务
     */
    @Tool(
            name = "updateProjectTaskStatus",
            description = "更新指定任务的状态，只修改状态字段，"
                    + "其余任务内容保持不变。"
    )
    public ProjectTaskDto updateProjectTaskStatus(
            @ToolParam(description = "任务ID") Long taskId,
            @ToolParam(
                    description = "目标状态编码，可选 todo、inProgress、"
                            + "pendingTest、pendingRelease、done、canceled"
            )
            String status) {
        ProjectTaskStatusUpdateCommand command =
                new ProjectTaskStatusUpdateCommand();
        command.setTaskId(taskId);
        command.setStatus(status);
        return projectTaskApi.updateTaskStatus(command);
    }

    /**
     * 查询我的待办。
     *
     * @param current 当前页
     * @param pageSize 每页条数
     * @param title 标题关键字
     * @param priority 优先级
     * @param status 状态
     * @return 分页结果
     */
    @Tool(
            name = "queryMyTodoTasks",
            description = "查询当前登录用户的待办任务列表。"
                    + "可按标题、优先级和状态筛选。"
    )
    public PageResult<MyTodoTaskDto> queryMyTodoTasks(
            @ToolParam(required = false, description = "当前页码，默认 1")
            Integer current,
            @ToolParam(required = false, description = "每页条数，默认 10")
            Integer pageSize,
            @ToolParam(required = false, description = "任务标题关键字")
            String title,
            @ToolParam(
                    required = false,
                    description = "任务优先级，可选 low、medium、high"
            )
            String priority,
            @ToolParam(
                    required = false,
                    description = "任务状态编码，可选 todo、inProgress、"
                            + "pendingTest、pendingRelease、done、canceled"
            )
            String status) {
        ProjectTaskMyTodoRequest request = new ProjectTaskMyTodoRequest();
        request.setCurrent(resolvePageNumber(current));
        request.setPageSize(resolvePageSize(pageSize));
        request.setTitle(title);
        request.setPriority(priority);
        request.setStatus(status);
        return projectTaskApi.queryMyTodo(request);
    }

    /**
     * 开始任务并生成分支建议。
     *
     * 该工具会先读取任务详情，给出推荐分支名和 git 命令。
     * 如果任务尚未开始且满足开始条件，则默认把任务状态推进到 inProgress，
     * 让 AI 助手可以在创建分支后直接进入实现阶段。
     *
     * @param taskId 任务 ID
     * @param gitUserName 本地 git 用户名；未提供时使用占位符
     * @param updateStatus 是否自动把任务切到进行中；默认 true
     * @return 开始任务指引
     */
    @Tool(
            name = "startProjectTask",
            description = "根据任务ID生成推荐分支名和开始任务指引。"
                    + "若任务满足开始条件，可自动把任务状态切到 inProgress。"
    )
    public TaskStartGuide startProjectTask(
            @ToolParam(description = "任务ID") Long taskId,
            @ToolParam(
                    required = false,
                    description = "本地 git 用户名，用于拼接分支名；不传则使用 <git-user>"
            )
            String gitUserName,
            @ToolParam(
                    required = false,
                    description = "是否自动把任务状态推进到 inProgress，默认 true"
            )
            Boolean updateStatus) {
        ProjectTaskDto task = projectTaskApi.getTaskDetail(taskId);
        String recommendedBranchName = buildRecommendedBranchName(
                task,
                gitUserName
        );
        String recommendedBranchCommand =
                "git checkout -b " + recommendedBranchName;
        String currentStatus = task.getStatus();
        String targetStatus = currentStatus;
        boolean shouldUpdateStatus = true;
        if (updateStatus != null) {
            shouldUpdateStatus = updateStatus;
        }

        if (shouldUpdateStatus
                && !"inProgress".equals(currentStatus)
                && !"done".equals(currentStatus)
                && !"canceled".equals(currentStatus)) {
            if (Boolean.FALSE.equals(task.getCanStart())) {
                return TaskStartGuide.builder()
                        .taskId(task.getId())
                        .taskTitle(task.getTitle())
                        .currentStatus(currentStatus)
                        .targetStatus(targetStatus)
                        .canStart(false)
                        .blockedReason(task.getBlockedReason())
                        .recommendedBranchName(recommendedBranchName)
                        .recommendedBranchCommand(recommendedBranchCommand)
                        .nextAction(buildBlockedNextAction(task))
                        .build();
            }

            ProjectTaskStatusUpdateCommand command =
                    new ProjectTaskStatusUpdateCommand();
            command.setTaskId(taskId);
            command.setStatus("inProgress");
            task = projectTaskApi.updateTaskStatus(command);
            targetStatus = task.getStatus();
        }

        return TaskStartGuide.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .currentStatus(currentStatus)
                .targetStatus(targetStatus)
                .canStart(task.getCanStart())
                .blockedReason(task.getBlockedReason())
                .recommendedBranchName(recommendedBranchName)
                .recommendedBranchCommand(recommendedBranchCommand)
                .nextAction(buildStartNextAction(task, recommendedBranchCommand))
                .build();
    }

    /**
     * 完成任务并补充开发完成动态。
     *
     * 该工具会把任务推进到待测试状态，并补充一条说明“开发已完成，
     * 待发布测试”的任务动态，帮助 AI 助手完成开发阶段的闭环。
     *
     * @param taskId 任务 ID
     * @param completionSummary 开发完成总结
     * @param mentionedUserIds 动态中 @ 的用户 ID 集合
     * @return 完成任务指引
     */
    @Tool(
            name = "completeProjectTask",
            description = "完成任务并将状态推进到 pendingTest，"
                    + "同时写入开发完成动态。"
    )
    public TaskCompleteGuide completeProjectTask(
            @ToolParam(description = "任务ID") Long taskId,
            @ToolParam(
                    required = false,
                    description = "开发完成总结，将附加到“开发已完成，待发布测试”动态之后"
            )
            String completionSummary,
            @ToolParam(
                    required = false,
                    description = "动态中 @ 的用户 ID 集合"
            )
            List<Long> mentionedUserIds) {
        ProjectTaskDto currentTask = projectTaskApi.getTaskDetail(taskId);

        ProjectTaskCompleteCommand command = new ProjectTaskCompleteCommand();
        command.setTaskId(taskId);
        command.setCompletionSummary(completionSummary);
        command.setMentionedUserIds(mentionedUserIds);

        ProjectTaskDto updatedTask = projectTaskApi.completeTask(command);
        return TaskCompleteGuide.builder()
                .taskId(updatedTask.getId())
                .taskTitle(updatedTask.getTitle())
                .currentStatus(currentTask.getStatus())
                .targetStatus(updatedTask.getStatus())
                .dynamicContent(buildCompletionDynamicContent(
                        completionSummary
                ))
                .nextAction(buildCompleteNextAction(updatedTask))
                .build();
    }

    /**
     * 生成日报。
     *
     * 日报同时基于任务与动态生成，
     * 适合回顾当天参与任务推进与关键沟通记录。
     *
     * @param reportDate 参考日期，格式 yyyy-MM-dd，默认今天
     * @return 日报内容
     */
    @Tool(
            name = "generateDailyReport",
            description = "生成日报。基于当前用户按参与度归属的任务与当天动态生成。"
    )
    public String generateDailyReport(
            @ToolParam(
                    required = false,
                    description = "参考日期，格式 yyyy-MM-dd，默认今天"
            )
            String reportDate) {
        return buildWorkReportText("daily", reportDate);
    }

    /**
     * 生成周报。
     *
     * 周报以任务变更为主，
     * 对未完成但期间内有动态更新的任务，会补充动态明细避免遗漏推进信息。
     *
     * @param reportDate 参考日期，格式 yyyy-MM-dd，默认今天
     * @return 周报内容
     */
    @Tool(
            name = "generateWeeklyReport",
            description = "生成周报。按参与度汇总当前用户本周相关任务，未完成任务若有动态更新会附带动态。"
    )
    public String generateWeeklyReport(
            @ToolParam(
                    required = false,
                    description = "参考日期，格式 yyyy-MM-dd，默认今天"
            )
            String reportDate) {
        return buildWorkReportText("weekly", reportDate);
    }

    /**
     * 生成月报。
     *
     * @param reportDate 参考日期，格式 yyyy-MM-dd，默认今天
     * @return 月报内容
     */
    @Tool(
            name = "generateMonthlyReport",
            description = "生成月报。按参与度汇总当前用户本月相关任务，未完成任务若有动态更新会附带动态。"
    )
    public String generateMonthlyReport(
            @ToolParam(
                    required = false,
                    description = "参考日期，格式 yyyy-MM-dd，默认今天"
            )
            String reportDate) {
        return buildWorkReportText("monthly", reportDate);
    }

    /**
     * 生成年报。
     *
     * @param reportDate 参考日期，格式 yyyy-MM-dd，默认今天
     * @return 年报内容
     */
    @Tool(
            name = "generateYearlyReport",
            description = "生成年报。按参与度汇总当前用户本年相关任务，未完成任务若有动态更新会附带动态。"
    )
    public String generateYearlyReport(
            @ToolParam(
                    required = false,
                    description = "参考日期，格式 yyyy-MM-dd，默认今天"
            )
            String reportDate) {
        return buildWorkReportText("yearly", reportDate);
    }

    private Integer resolvePageNumber(Integer current) {
        if (current == null || current < 1) {
            return 1;
        }
        return current;
    }

    private Integer resolvePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return 10;
        }
        return pageSize;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value, DATE_TIME_FORMATTER);
    }

    /**
     * 生成推荐分支名。
     *
     * 这里保留 feat/<git-user>/ 前缀模板，
     * 让 AI 助手能够把本地 git 用户名补进最终命令中。
     *
     * @param task 任务详情
     * @param gitUserName git 用户名
     * @return 推荐分支名
     */
    private String buildRecommendedBranchName(
            ProjectTaskDto task,
            String gitUserName) {
        String normalizedGitUser = normalizeBranchSegment(gitUserName);
        if (normalizedGitUser.isBlank()) {
            normalizedGitUser = "<git-user>";
        }

        String titleSlug = normalizeBranchSegment(task.getTitle());
        if (titleSlug.isBlank()) {
            titleSlug = "task";
        }
        if (titleSlug.length() > MAX_BRANCH_SLUG_LENGTH) {
            titleSlug = titleSlug.substring(0, MAX_BRANCH_SLUG_LENGTH);
        }
        titleSlug = trimBranchSeparator(titleSlug);
        return "feat/"
                + normalizedGitUser
                + "/task-"
                + task.getId()
                + "-"
                + titleSlug;
    }

    /**
     * 规范化分支片段。
     *
     * 这里统一把中文、空白和特殊字符转换为安全的短横线片段，
     * 避免 AI 直接拿标题生成的分支名在本地 Git 中不可用。
     *
     * @param value 原始文本
     * @return 规范化后的分支片段
     */
    private String normalizeBranchSegment(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "");
        normalized = normalized.toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9]+", "-");
        normalized = trimBranchSeparator(normalized);
        return normalized;
    }

    /**
     * 去掉分支片段首尾的分隔符。
     *
     * @param value 原始值
     * @return 清理后的值
     */
    private String trimBranchSeparator(String value) {
        String result = value;
        while (result.startsWith("-")) {
            result = result.substring(1);
        }
        while (result.endsWith("-")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    /**
     * 构造被阻塞时的下一步提示。
     *
     * @param task 任务详情
     * @return 下一步提示
     */
    private String buildBlockedNextAction(ProjectTaskDto task) {
        String blockedReason = task.getBlockedReason();
        if (blockedReason == null || blockedReason.isBlank()) {
            blockedReason = "当前任务未满足开始条件";
        }
        return "任务暂时不能开始，请先处理阻塞项："
                + blockedReason
                + "。处理完成后，再创建分支并开始开发。";
    }

    /**
     * 构造正常开始时的下一步提示。
     *
     * @param task 任务详情
     * @param recommendedBranchCommand 推荐分支命令
     * @return 下一步提示
     */
    private String buildStartNextAction(
            ProjectTaskDto task,
            String recommendedBranchCommand) {
        return "先执行 `"
                + recommendedBranchCommand
                + "` 创建分支，再围绕任务【"
                + task.getTitle()
                + "】开始实现。";
    }

    /**
     * 构造完成任务时的动态文案。
     *
     * @param completionSummary 开发完成总结
     * @return 动态内容
     */
    private String buildCompletionDynamicContent(String completionSummary) {
        String prefix = "开发已完成，待发布测试。";
        if (completionSummary == null || completionSummary.isBlank()) {
            return prefix;
        }
        return prefix + System.lineSeparator()
                + "开发总结：" + completionSummary.trim();
    }

    /**
     * 构造工作汇报文本。
     *
     * 这里直接输出结构化纯文本，
     * 让模型在拿到工具结果时既能直接引用，也能在此基础上继续润色。
     *
     * @param reportType 汇报类型
     * @param reportDate 参考日期
     * @return 汇报文本
     */
    private String buildWorkReportText(String reportType, String reportDate) {
        ProjectTaskWorkReportCommand command = new ProjectTaskWorkReportCommand();
        command.setReportType(reportType);
        command.setReferenceDate(parseDate(reportDate));
        ProjectTaskWorkReportDto report = projectTaskApi.generateWorkReport(
                command
        );

        StringBuilder builder = new StringBuilder();
        builder.append(report.getReportTitle()).append(System.lineSeparator());
        builder.append("统计区间：")
                .append(report.getPeriodStart())
                .append(" ~ ")
                .append(report.getPeriodEnd())
                .append(System.lineSeparator());
        appendTaskSection(builder, report.getTasks());
        appendDynamicSection(builder, report.getDynamics());
        return builder.toString().trim();
    }

    /**
     * 追加任务章节。
     *
     * @param builder 文本构造器
     * @param tasks 任务列表
     */
    private void appendTaskSection(
            StringBuilder builder,
            List<ProjectTaskWorkReportTaskDto> tasks) {
        builder.append(System.lineSeparator())
                .append("参与任务：")
                .append(System.lineSeparator());
        if (tasks == null || tasks.isEmpty()) {
            builder.append("1. 本周期无命中的参与任务。")
                    .append(System.lineSeparator());
            return;
        }

        int index = 1;
        for (ProjectTaskWorkReportTaskDto task : tasks) {
            builder.append(index)
                    .append(". [")
                    .append(task.getStatus())
                    .append("][")
                    .append(task.getPriority())
                    .append("] ")
                    .append(task.getTitle());
            if (task.getProjectName() != null && !task.getProjectName().isBlank()) {
                builder.append("（").append(task.getProjectName()).append("）");
            }
            builder.append(System.lineSeparator())
                    .append("   参与身份：")
                    .append(task.getParticipationRole())
                    .append(System.lineSeparator())
                    .append("   更新时间：")
                    .append(task.getUpdatedAt());
            if (task.getLatestDynamicSummary() != null
                    && !task.getLatestDynamicSummary().isBlank()) {
                builder.append(System.lineSeparator())
                        .append("   最新动态：")
                        .append(task.getLatestDynamicSummary());
            }
            builder.append(System.lineSeparator());
            index++;
        }
    }

    /**
     * 追加动态章节。
     *
     * @param builder 文本构造器
     * @param dynamics 动态列表
     */
    private void appendDynamicSection(
            StringBuilder builder,
            List<ProjectTaskWorkReportDynamicDto> dynamics) {
        builder.append(System.lineSeparator())
                .append("任务动态：")
                .append(System.lineSeparator());
        if (dynamics == null || dynamics.isEmpty()) {
            builder.append("1. 本周期无需要补充的任务动态。")
                    .append(System.lineSeparator());
            return;
        }

        int index = 1;
        for (ProjectTaskWorkReportDynamicDto dynamic : dynamics) {
            builder.append(index)
                    .append(". ")
                    .append(dynamic.getCreatedAt())
                    .append(" ");
            if (dynamic.getProjectName() != null && !dynamic.getProjectName().isBlank()) {
                builder.append("[").append(dynamic.getProjectName()).append("] ");
            }
            builder.append("《")
                    .append(dynamic.getTaskTitle())
                    .append("》");
            if (dynamic.getOperatorName() != null
                    && !dynamic.getOperatorName().isBlank()) {
                builder.append(" ")
                        .append(dynamic.getOperatorName())
                        .append("：");
            } else {
                builder.append("：");
            }
            builder.append(dynamic.getContent())
                    .append(System.lineSeparator());
            index++;
        }
    }

    /**
     * 解析文本日期。
     *
     * @param value 文本日期
     * @return 日期对象
     */
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
    }

    /**
     * 构造完成任务后的下一步提示。
     *
     * @param task 任务详情
     * @return 下一步提示
     */
    private String buildCompleteNextAction(ProjectTaskDto task) {
        return "任务【"
                + task.getTitle()
                + "】已进入待测试阶段，请通知测试或发布同学继续跟进。";
    }
}
