package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 项目任务服务，负责任务写入流程编排。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskService extends ServiceImpl<ProjectTaskMapper, ProjectTask> implements IService<ProjectTask> {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 任务读模型服务。
     */
    private final ProjectTaskReadService projectTaskReadService;

    /**
     * 任务写入规则校验服务。
     */
    private final ProjectTaskGuardService projectTaskGuardService;

    /**
     * 任务生命周期服务。
     */
    private final ProjectTaskLifecycleService projectTaskLifecycleService;

    /**
     * 任务依赖关系服务。
     */
    private final ProjectTaskDependencyService projectTaskDependencyService;

    /**
     * 任务标签绑定服务。
     */
    private final ProjectTaskTagBindingService projectTaskTagBindingService;

    /**
     * 任务详情组装服务。
     */
    private final ProjectTaskViewAssembler projectTaskViewAssembler;

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
        return projectTaskReadService.getMyTodoList(request);
    }

    /**
     * 获取任务列表。
     *
     * @param request 列表请求
     * @return 分页任务列表
     */
    public PageResponse<ProjectTaskDetailVo> getList(ProjectTaskListRequest request) {
        return projectTaskReadService.getList(request);
    }

    /**
     * 获取任务详情。
     *
     * @param id 任务 ID
     * @return 任务详情
     */
    public ProjectTaskDetailVo getDetail(Long id) {
        ProjectTask task = requireTask(id);
        return projectTaskViewAssembler.toTaskVo(task);
    }

    /**
     * 获取子任务列表。
     *
     * @param parentTaskId 父任务 ID
     * @return 子任务列表
     */
    public List<ProjectTaskDetailVo> getChildren(Long parentTaskId) {
        ProjectTask parentTask = requireTask(parentTaskId);
        return projectTaskReadService.getChildren(parentTask);
    }

    /**
     * 批量获取子任务列表。
     *
     * @param parentTaskIds 父任务 ID 列表
     * @return 子任务列表
     */
    public List<ProjectTaskDetailVo> getChildrenBatch(List<Long> parentTaskIds) {
        if (parentTaskIds == null || parentTaskIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProjectTask> parentTasks = new ArrayList<>();
        for (Long parentTaskId : parentTaskIds) {
            parentTasks.add(requireTask(parentTaskId));
        }
        if (parentTasks.isEmpty()) {
            return Collections.emptyList();
        }
        return projectTaskReadService.getChildrenBatch(parentTasks);
    }

    /**
     * 按编号获取任务详情。
     *
     * @param code 任务编号
     * @return 任务详情
     */
    public ProjectTaskDetailVo getDetailByCode(String code) {
        return projectTaskReadService.getDetailByVisibleNumber(code);
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
        Project project = projectService.requireProject(request.getProjectId());
        String status = projectTaskGuardService.validateStatus(request.getStatus());
        projectTaskGuardService.validatePriority(request.getPriority());
        projectTaskGuardService.validateWorkDays(request.getWorkDays());
        projectTaskGuardService.validateTimeRange(request.getStartTime(), request.getDueTime());
        projectTaskGuardService.validateAssignee(request.getAssigneeId());
        projectTaskGuardService.ensureProjectMember(request.getProjectId(), request.getAssigneeId());

        projectTaskGuardService.validateParentTaskForCreate(project.getId(), request.getParentTaskId());
        List<Long> predecessorTaskIds = projectTaskGuardService.normalizeIdList(request.getPredecessorTaskIds());
        projectTaskGuardService.validateBlockedStatusForDependencies(status, project.getId(), predecessorTaskIds);
        List<Long> tagIds = projectTaskGuardService.normalizeIdList(request.getTagIds());

        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        ProjectTask task = new ProjectTask();
        task.setProjectId(request.getProjectId());
        task.setParentTaskId(request.getParentTaskId());
        task.setTitle(request.getTitle().trim());
        task.setDescription(projectTaskGuardService.normalizeDescription(request.getDescription()));
        task.setStatus(status);
        task.setPriority(request.getPriority().trim());
        task.setWorkDays(request.getWorkDays());
        task.setCreatorId(currentUser.getUserId());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
        task.setDeleted(0);
        save(task);

        projectTaskGuardService.ensureAssigneeMember(task);
        projectTaskDependencyService.saveDependencies(task.getId(), task.getProjectId(), predecessorTaskIds);
        projectTaskTagBindingService.saveBindings(task.getId(), project.getTenantId(), tagIds);
        projectTaskChangeLogService.logCreate(task);
        return projectTaskViewAssembler.toTaskVo(task);
    }

    /**
     * 编辑任务。
     *
     * @param id      任务 ID
     * @param request 编辑请求
     * @return 任务详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskDetailVo edit(Long id, ProjectTaskEditRequest request) {
        ProjectTask task = requireTask(id);
        Project project = projectService.requireProject(task.getProjectId());
        ProjectTask beforeTask = copyTask(task);
        List<Long> beforePredecessorTaskIds = projectTaskDependencyService.findPredecessorIdsByTaskId(task.getId());
        List<Long> beforeTagIds = projectTaskTagBindingService.findTagIdsByTaskId(task.getId());

        String status = projectTaskGuardService.validateStatus(request.getStatus());
        projectTaskGuardService.validatePriority(request.getPriority());
        projectTaskGuardService.validateWorkDays(request.getWorkDays());
        projectTaskGuardService.validateTimeRange(request.getStartTime(), request.getDueTime());
        projectTaskGuardService.validateAssignee(request.getAssigneeId());
        projectTaskGuardService.ensureProjectMember(task.getProjectId(), request.getAssigneeId());

        Long targetParentTaskId = resolveEditParentTaskId(task.getParentTaskId(), request.getParentTaskId());
        projectTaskGuardService.validateParentTaskForEdit(task, targetParentTaskId);

        List<Long> targetPredecessorTaskIds = resolveEditRelationIds(beforePredecessorTaskIds, request.getPredecessorTaskIds());
        projectTaskGuardService.validateBlockedStatusForDependencies(status, task.getProjectId(), targetPredecessorTaskIds);
        projectTaskGuardService.validateCompleteStatusWithChildren(task.getId(), status);

        List<Long> targetTagIds = resolveEditRelationIds(beforeTagIds, request.getTagIds());
        applyTaskUpdate(task, request, status, targetParentTaskId);
        updateById(task);

        projectTaskGuardService.ensureAssigneeMember(task);
        projectTaskDependencyService.saveDependencies(task.getId(), task.getProjectId(), targetPredecessorTaskIds);
        projectTaskTagBindingService.saveBindings(task.getId(), project.getTenantId(), targetTagIds);

        List<Long> afterPredecessorTaskIds = projectTaskDependencyService.findPredecessorIdsByTaskId(task.getId());
        List<Long> afterTagIds = projectTaskTagBindingService.findTagIdsByTaskId(task.getId());
        projectTaskChangeLogService.logUpdate(beforeTask, task);
        projectTaskChangeLogService.logRelationUpdate(task.getId(), beforeTask.getParentTaskId(), task.getParentTaskId(), beforePredecessorTaskIds, afterPredecessorTaskIds);
        projectTaskChangeLogService.logTagBindingUpdate(task.getId(), beforeTagIds, afterTagIds);

        projectTaskLifecycleService.handleTaskCompleted(task, beforeTask.getStatus());
        return projectTaskViewAssembler.toTaskVo(task);
    }

    /**
     * 逻辑删除任务。
     *
     * @param ids 任务 ID 列表
     * @return 删除数量
     */
    @Transactional(rollbackFor = Exception.class)
    public int deleted(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }

        List<ProjectTask> tasks = new ArrayList<>();
        for (Long id : ids) {
            tasks.add(requireTask(id));
        }
        if (tasks.isEmpty()) {
            return 0;
        }

        for (ProjectTask task : tasks) {
            if (projectTaskDependencyService.hasDependentTasks(task.getId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前任务已被依赖，不能删除");
            }
            if (projectTaskGuardService.hasChildTasks(task.getId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前任务存在子任务，不能删除");
            }
        }

        List<Long> taskIds = tasks.stream().map(ProjectTask::getId).toList();
        for (ProjectTask task : tasks) {
            projectTaskChangeLogService.logDelete(task);
            projectTaskDependencyService.deleteByTaskId(task.getId());
        }
        projectTaskTagBindingService.deleteByTaskIds(taskIds);
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
        projectService.requireProject(task.getProjectId());
        return task;
    }

    private Long resolveEditParentTaskId(Long currentParentTaskId, Long nextParentTaskId) {
        if (nextParentTaskId != null) {
            return nextParentTaskId;
        }
        return currentParentTaskId;
    }

    private List<Long> resolveEditRelationIds(List<Long> currentIds, List<Long> nextIds) {
        if (nextIds != null) {
            return projectTaskGuardService.normalizeIdList(nextIds);
        }
        return currentIds;
    }

    private void applyTaskUpdate(ProjectTask task, ProjectTaskEditRequest request, String status, Long parentTaskId) {
        task.setParentTaskId(parentTaskId);
        task.setTitle(request.getTitle().trim());
        task.setDescription(projectTaskGuardService.normalizeDescription(request.getDescription()));
        task.setStatus(status);
        task.setPriority(request.getPriority().trim());
        task.setWorkDays(request.getWorkDays());
        task.setAssigneeId(request.getAssigneeId());
        task.setStartTime(request.getStartTime());
        task.setDueTime(request.getDueTime());
    }

    private ProjectTask copyTask(ProjectTask source) {
        ProjectTask target = new ProjectTask();
        target.setId(source.getId());
        target.setProjectId(source.getProjectId());
        target.setParentTaskId(source.getParentTaskId());
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
}
