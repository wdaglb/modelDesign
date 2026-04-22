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

import java.util.List;

/**
 * 项目任务对外查询与写入接口。
 */
public interface ProjectTaskApi {
    /**
     * 按条件查询项目任务列表。
     *
     * @param request 查询条件
     * @return 分页任务结果
     */
    PageResult<ProjectTaskDto> queryTasks(ProjectTaskQueryRequest request);

    /**
     * 查询当前租户可用的任务类型列表。
     *
     * @param name 类型名称关键字
     * @return 任务类型列表
     */
    List<ProjectTaskTypeDto> queryTaskTypes(String name);

    /**
     * 按任务可见编号获取任务详情。
     *
     * @param code 任务编号
     * @return 任务详情
     */
    ProjectTaskDto getTaskDetailByCode(String code);

    /**
     * 获取任务详情。
     *
     * @param taskId 任务 ID
     * @return 任务详情
     */
    ProjectTaskDto getTaskDetail(Long taskId);

    /**
     * 创建任务。
     *
     * @param command 创建命令
     * @return 创建后的任务结果
     */
    ProjectTaskDto createTask(ProjectTaskCreateCommand command);

    /**
     * 完成任务并补充开发完成动态。
     *
     * @param command 完成任务命令
     * @return 更新后的任务结果
     */
    ProjectTaskDto completeTask(ProjectTaskCompleteCommand command);

    /**
     * 更新任务状态。
     *
     * @param command 状态更新命令
     * @return 更新后的任务结果
     */
    ProjectTaskDto updateTaskStatus(ProjectTaskStatusUpdateCommand command);

    /**
     * 查询当前登录用户的待办列表。
     *
     * @param request 查询条件
     * @return 分页待办结果
     */
    PageResult<MyTodoTaskDto> queryMyTodo(ProjectTaskMyTodoRequest request);

    /**
     * 生成当前登录用户的工作汇报。
     *
     * @param command 汇报查询命令
     * @return 汇报结果
     */
    ProjectTaskWorkReportDto generateWorkReport(
            ProjectTaskWorkReportCommand command);
}
