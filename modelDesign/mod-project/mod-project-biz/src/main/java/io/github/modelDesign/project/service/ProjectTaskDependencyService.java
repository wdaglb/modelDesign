package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskDependency;
import io.github.modelDesign.project.mapper.ProjectTaskDependencyMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.response.ProjectTaskPredecessorVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 任务依赖关系服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskDependencyService {
    /**
     * 任务依赖关系 Mapper。
     */
    private final ProjectTaskDependencyMapper projectTaskDependencyMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 覆盖保存任务依赖关系。
     *
     * @param taskId               任务 ID
     * @param projectId            项目 ID
     * @param predecessorTaskIds 前置任务 ID 列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveDependencies(Long taskId, Long projectId, List<Long> predecessorTaskIds) {
        List<Long> normalizedPredecessorIds = normalizeTaskIds(predecessorTaskIds);
        List<ProjectTaskDependency> existingDependencies = projectTaskDependencyMapper.selectList(new LambdaQueryWrapper<ProjectTaskDependency>()
                .eq(ProjectTaskDependency::getTaskId, taskId));
        if (normalizedPredecessorIds.isEmpty()) {
            deleteDependencies(existingDependencies);
            return;
        }

        validatePredecessors(taskId, projectId, normalizedPredecessorIds);
        validateCycle(taskId, normalizedPredecessorIds);

        Set<Long> targetTaskIdSet = new LinkedHashSet<>(normalizedPredecessorIds);
        Set<Long> existedTaskIdSet = new LinkedHashSet<>();
        List<Long> deletedIds = new ArrayList<>();
        for (ProjectTaskDependency dependency : existingDependencies) {
            existedTaskIdSet.add(dependency.getPredecessorTaskId());
            if (!targetTaskIdSet.contains(dependency.getPredecessorTaskId())) {
                deletedIds.add(dependency.getId());
            }
        }
        if (!deletedIds.isEmpty()) {
            projectTaskDependencyMapper.deleteBatchIds(deletedIds);
        }

        for (Long predecessorTaskId : targetTaskIdSet) {
            if (existedTaskIdSet.contains(predecessorTaskId)) {
                continue;
            }
            ProjectTaskDependency dependency = new ProjectTaskDependency();
            dependency.setTaskId(taskId);
            dependency.setPredecessorTaskId(predecessorTaskId);
            projectTaskDependencyMapper.insert(dependency);
        }
    }

    /**
     * 判断任务是否可开始。
     *
     * @param taskId 任务 ID
     * @return 是否可开始
     */
    public boolean canStart(Long taskId) {
        List<ProjectTaskPredecessorVo> unfinishedPredecessors = findUnfinishedPredecessors(taskId);
        return unfinishedPredecessors.isEmpty();
    }

    /**
     * 查询未完成前置任务列表。
     *
     * @param taskId 任务 ID
     * @return 未完成前置任务列表
     */
    public List<ProjectTaskPredecessorVo> findUnfinishedPredecessors(Long taskId) {
        Map<Long, List<ProjectTaskPredecessorVo>> unfinishedMap = findUnfinishedPredecessorMapByTaskIds(List.of(taskId));
        List<ProjectTaskPredecessorVo> unfinishedPredecessors = unfinishedMap.get(taskId);
        if (unfinishedPredecessors == null) {
            return Collections.emptyList();
        }
        return unfinishedPredecessors;
    }

    /**
     * 批量查询前置任务列表。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到前置任务列表的映射
     */
    public Map<Long, List<ProjectTaskPredecessorVo>> findPredecessorMapByTaskIds(Collection<Long> taskIds) {
        if (CollectionUtils.isEmpty(taskIds)) {
            return Collections.emptyMap();
        }
        List<ProjectTaskDependency> dependencies = projectTaskDependencyMapper.selectList(new LambdaQueryWrapper<ProjectTaskDependency>()
                .in(ProjectTaskDependency::getTaskId, taskIds));
        if (dependencies.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> predecessorTaskIds = new LinkedHashSet<>();
        for (ProjectTaskDependency dependency : dependencies) {
            predecessorTaskIds.add(dependency.getPredecessorTaskId());
        }
        Map<Long, ProjectTask> predecessorTaskMap = getTaskMap(predecessorTaskIds);

        Map<Long, List<ProjectTaskPredecessorVo>> predecessorMap = new LinkedHashMap<>();
        for (ProjectTaskDependency dependency : dependencies) {
            ProjectTask predecessorTask = predecessorTaskMap.get(dependency.getPredecessorTaskId());
            if (predecessorTask == null) {
                continue;
            }
            List<ProjectTaskPredecessorVo> predecessors = predecessorMap.computeIfAbsent(dependency.getTaskId(), key -> new ArrayList<>());
            predecessors.add(toPredecessorVo(predecessorTask));
        }
        return predecessorMap;
    }

    /**
     * 批量查询未完成前置任务列表。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到未完成前置任务列表映射
     */
    public Map<Long, List<ProjectTaskPredecessorVo>> findUnfinishedPredecessorMapByTaskIds(Collection<Long> taskIds) {
        Map<Long, List<ProjectTaskPredecessorVo>> predecessorMap = findPredecessorMapByTaskIds(taskIds);
        if (predecessorMap.isEmpty()) {
            return Collections.emptyMap();
        }
        String completedStatusCode = taskStatusConfigService.getCompletedStatusCode();
        Map<Long, List<ProjectTaskPredecessorVo>> unfinishedMap = new LinkedHashMap<>();
        for (Map.Entry<Long, List<ProjectTaskPredecessorVo>> entry : predecessorMap.entrySet()) {
            List<ProjectTaskPredecessorVo> unfinishedPredecessors = new ArrayList<>();
            for (ProjectTaskPredecessorVo predecessor : entry.getValue()) {
                if (completedStatusCode.equals(predecessor.getStatus())) {
                    continue;
                }
                unfinishedPredecessors.add(predecessor);
            }
            if (unfinishedPredecessors.isEmpty()) {
                continue;
            }
            unfinishedMap.put(entry.getKey(), unfinishedPredecessors);
        }
        return unfinishedMap;
    }

    /**
     * 批量查询前置任务 ID 列表。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到前置任务 ID 列表映射
     */
    public Map<Long, List<Long>> findPredecessorIdMapByTaskIds(Collection<Long> taskIds) {
        if (CollectionUtils.isEmpty(taskIds)) {
            return Collections.emptyMap();
        }
        List<ProjectTaskDependency> dependencies = projectTaskDependencyMapper.selectList(new LambdaQueryWrapper<ProjectTaskDependency>()
                .in(ProjectTaskDependency::getTaskId, taskIds));
        if (dependencies.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, List<Long>> predecessorIdMap = new LinkedHashMap<>();
        for (ProjectTaskDependency dependency : dependencies) {
            List<Long> predecessorIds = predecessorIdMap.computeIfAbsent(dependency.getTaskId(), key -> new ArrayList<>());
            predecessorIds.add(dependency.getPredecessorTaskId());
        }
        return predecessorIdMap;
    }

    /**
     * 查询单个任务前置任务 ID 列表。
     *
     * @param taskId 任务 ID
     * @return 前置任务 ID 列表
     */
    public List<Long> findPredecessorIdsByTaskId(Long taskId) {
        Map<Long, List<Long>> predecessorIdMap = findPredecessorIdMapByTaskIds(List.of(taskId));
        List<Long> predecessorIds = predecessorIdMap.get(taskId);
        if (predecessorIds == null) {
            return Collections.emptyList();
        }
        return predecessorIds;
    }

    /**
     * 按前置任务查询依赖该任务的任务 ID 列表。
     *
     * @param predecessorTaskId 前置任务 ID
     * @return 依赖该任务的任务 ID 列表
     */
    public List<Long> findDependentTaskIds(Long predecessorTaskId) {
        List<ProjectTaskDependency> dependencies = projectTaskDependencyMapper.selectList(new LambdaQueryWrapper<ProjectTaskDependency>()
                .eq(ProjectTaskDependency::getPredecessorTaskId, predecessorTaskId));
        if (dependencies.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> taskIds = new LinkedHashSet<>();
        for (ProjectTaskDependency dependency : dependencies) {
            taskIds.add(dependency.getTaskId());
        }
        return new ArrayList<>(taskIds);
    }

    /**
     * 判断任务是否被其他任务依赖。
     *
     * @param taskId 任务 ID
     * @return 是否被依赖
     */
    public boolean hasDependentTasks(Long taskId) {
        Long count = projectTaskDependencyMapper.selectCount(new LambdaQueryWrapper<ProjectTaskDependency>()
                .eq(ProjectTaskDependency::getPredecessorTaskId, taskId));
        if (count == null) {
            return false;
        }
        return count > 0;
    }

    /**
     * 删除任务作为后续任务的依赖关系。
     *
     * @param taskId 任务 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByTaskId(Long taskId) {
        projectTaskDependencyMapper.delete(new LambdaQueryWrapper<ProjectTaskDependency>()
                .eq(ProjectTaskDependency::getTaskId, taskId));
    }

    private void deleteDependencies(List<ProjectTaskDependency> dependencies) {
        if (dependencies.isEmpty()) {
            return;
        }
        List<Long> dependencyIds = new ArrayList<>();
        for (ProjectTaskDependency dependency : dependencies) {
            dependencyIds.add(dependency.getId());
        }
        projectTaskDependencyMapper.deleteBatchIds(dependencyIds);
    }

    private void validatePredecessors(Long taskId, Long projectId, List<Long> predecessorTaskIds) {
        if (predecessorTaskIds.contains(taskId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务不能依赖自身");
        }
        List<ProjectTask> predecessorTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getId, predecessorTaskIds)
                .eq(ProjectTask::getProjectId, projectId)
                .eq(ProjectTask::getDeleted, 0));
        if (predecessorTasks.size() != predecessorTaskIds.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "前置任务不存在或不属于当前项目");
        }
    }

    private void validateCycle(Long taskId, List<Long> predecessorTaskIds) {
        Map<Long, Set<Long>> predecessorGraph = buildPredecessorGraph();
        predecessorGraph.put(taskId, new LinkedHashSet<>(predecessorTaskIds));
        for (Long predecessorTaskId : predecessorTaskIds) {
            if (hasPath(predecessorTaskId, taskId, predecessorGraph)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务依赖存在循环关系");
            }
        }
    }

    private Map<Long, Set<Long>> buildPredecessorGraph() {
        List<ProjectTaskDependency> dependencies = projectTaskDependencyMapper.selectList(new LambdaQueryWrapper<>());
        if (dependencies.isEmpty()) {
            return new LinkedHashMap<>();
        }
        Map<Long, Set<Long>> predecessorGraph = new LinkedHashMap<>();
        for (ProjectTaskDependency dependency : dependencies) {
            Set<Long> predecessors = predecessorGraph.computeIfAbsent(dependency.getTaskId(), key -> new LinkedHashSet<>());
            predecessors.add(dependency.getPredecessorTaskId());
        }
        return predecessorGraph;
    }

    private boolean hasPath(Long fromTaskId, Long targetTaskId, Map<Long, Set<Long>> predecessorGraph) {
        Set<Long> visitedTaskIds = new LinkedHashSet<>();
        ArrayDeque<Long> pendingTaskIds = new ArrayDeque<>();
        pendingTaskIds.push(fromTaskId);
        while (!pendingTaskIds.isEmpty()) {
            Long currentTaskId = pendingTaskIds.pop();
            if (!visitedTaskIds.add(currentTaskId)) {
                continue;
            }
            if (targetTaskId.equals(currentTaskId)) {
                return true;
            }
            Set<Long> predecessors = predecessorGraph.get(currentTaskId);
            if (CollectionUtils.isEmpty(predecessors)) {
                continue;
            }
            for (Long predecessorTaskId : predecessors) {
                pendingTaskIds.push(predecessorTaskId);
            }
        }
        return false;
    }

    private Map<Long, ProjectTask> getTaskMap(Set<Long> taskIds) {
        if (taskIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProjectTask> tasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .in(ProjectTask::getId, taskIds)
                .eq(ProjectTask::getDeleted, 0));
        if (tasks.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, ProjectTask> taskMap = new LinkedHashMap<>();
        for (ProjectTask task : tasks) {
            taskMap.put(task.getId(), task);
        }
        return taskMap;
    }

    private ProjectTaskPredecessorVo toPredecessorVo(ProjectTask task) {
        return ProjectTaskPredecessorVo.builder()
                .taskId(task.getId())
                .title(task.getTitle())
                .status(task.getStatus())
                .build();
    }

    private List<Long> normalizeTaskIds(List<Long> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> normalizedTaskIds = new LinkedHashSet<>();
        for (Long taskId : taskIds) {
            if (taskId == null || taskId <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "前置任务 ID 不合法");
            }
            normalizedTaskIds.add(taskId);
        }
        return new ArrayList<>(normalizedTaskIds);
    }
}
