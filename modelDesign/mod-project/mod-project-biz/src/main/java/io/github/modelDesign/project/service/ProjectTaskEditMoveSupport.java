package io.github.modelDesign.project.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.request.ProjectTaskEditRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * 任务编辑时的跨项目移动支持服务。
 *
 * 任务编辑主服务已经承担创建、删除、动态、依赖与标签编排；跨项目移动又涉及
 * 父子关系和前置依赖的清理规则，因此单独下沉到这里，避免主服务继续膨胀。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskEditMoveSupport {
    /**
     * 任务写入规则校验服务。
     */
    private final ProjectTaskGuardService projectTaskGuardService;

    /**
     * 任务依赖关系服务。
     */
    private final ProjectTaskDependencyService projectTaskDependencyService;

    /**
     * 解析编辑后的项目 ID。
     *
     * 老客户端不会提交 projectId，必须继续保持“编辑任务不移动项目”的兼容行为。
     *
     * @param currentProjectId 当前项目 ID
     * @param nextProjectId    请求中的目标项目 ID
     * @return 最终项目 ID
     */
    public Long resolveProjectId(Long currentProjectId, Long nextProjectId) {
        if (nextProjectId != null) {
            return nextProjectId;
        }
        return currentProjectId;
    }

    /**
     * 判断任务是否发生跨项目移动。
     *
     * @param task            当前任务
     * @param targetProjectId 目标项目 ID
     * @return 是否修改了所属项目
     */
    public boolean isProjectChanged(ProjectTask task, Long targetProjectId) {
        return !Objects.equals(task.getProjectId(), targetProjectId);
    }

    /**
     * 校验任务跨项目移动前置条件。
     *
     * 跨项目移动只处理当前任务本身；如果任务仍有子任务或被其他任务依赖，直接移动
     * 会留下跨项目父子关系或依赖关系，因此先阻断这类需要级联迁移的复杂场景。
     *
     * @param task           当前任务
     * @param projectChanged 是否变更项目
     */
    public void validateProjectMove(ProjectTask task, boolean projectChanged) {
        if (!projectChanged) {
            return;
        }
        if (projectTaskGuardService.hasChildTasks(task.getId())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "当前任务存在子任务，不能修改所属项目"
            );
        }
        if (projectTaskDependencyService.hasDependentTasks(task.getId())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "当前任务已被依赖，不能修改所属项目"
            );
        }
    }

    /**
     * 解析编辑后的父任务 ID。
     *
     * 跨项目移动时，旧父任务属于原项目，默认解除父子关系；只有请求明确传入不同的
     * 父任务 ID 时，才按目标项目重新校验并绑定。
     *
     * @param task           当前任务
     * @param request        编辑请求
     * @param projectChanged 是否变更项目
     * @return 最终父任务 ID
     */
    public Long resolveParentTaskId(
            ProjectTask task,
            ProjectTaskEditRequest request,
            boolean projectChanged) {
        Long nextParentTaskId = request.getParentTaskId();
        if (!projectChanged) {
            if (nextParentTaskId != null) {
                return nextParentTaskId;
            }
            return task.getParentTaskId();
        }
        if (nextParentTaskId == null) {
            return null;
        }
        if (Objects.equals(nextParentTaskId, task.getParentTaskId())) {
            return null;
        }
        return nextParentTaskId;
    }

    /**
     * 解析编辑后的跨项目任务关联 ID 列表。
     *
     * 跨项目移动时，旧前置任务属于原项目；请求未显式传入新列表时默认清空，避免
     * 保存后产生跨项目依赖。
     *
     * @param currentIds     当前关联 ID
     * @param nextIds        请求中的关联 ID
     * @param projectChanged 是否变更项目
     * @return 最终关联 ID
     */
    public List<Long> resolveTaskRelationIds(
            List<Long> currentIds,
            List<Long> nextIds,
            boolean projectChanged) {
        if (nextIds != null) {
            return projectTaskGuardService.normalizeIdList(nextIds);
        }
        if (projectChanged) {
            return Collections.emptyList();
        }
        return currentIds;
    }
}
