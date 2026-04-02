package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskTag;
import io.github.modelDesign.project.domain.TaskTag;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskTagMapper;
import io.github.modelDesign.project.mapper.TaskTagMapper;
import io.github.modelDesign.project.response.ProjectTaskTagVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 任务标签绑定服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskTagBindingService {
    /**
     * 任务标签绑定 Mapper。
     */
    private final ProjectTaskTagMapper projectTaskTagMapper;

    /**
     * 标签 Mapper。
     */
    private final TaskTagMapper taskTagMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 项目 Mapper。
     */
    private final ProjectMapper projectMapper;

    /**
     * 覆盖保存任务标签绑定关系。
     *
     * @param taskId 任务 ID
     * @param tagIds 标签 ID 列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveBindings(Long taskId, List<Long> tagIds) {
        ProjectTask task = requireTask(taskId);
        Project project = requireProject(task.getProjectId());
        saveBindings(taskId, project.getTenantId(), tagIds);
    }

    /**
     * 覆盖保存任务标签绑定关系。
     *
     * @param taskId    任务 ID
     * @param tenantId  租户 ID
     * @param tagIds 标签 ID 列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveBindings(Long taskId, Long tenantId, List<Long> tagIds) {
        List<Long> normalizedTagIds = normalizeTagIds(tagIds);
        List<ProjectTaskTag> existingBindings = projectTaskTagMapper.selectList(new LambdaQueryWrapper<ProjectTaskTag>()
                .eq(ProjectTaskTag::getTaskId, taskId));

        if (normalizedTagIds.isEmpty()) {
            deleteBindings(existingBindings);
            return;
        }

        Map<Long, TaskTag> tagMap = getTenantTagMap(tenantId, normalizedTagIds);
        if (tagMap.size() != normalizedTagIds.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "存在无效标签或跨租户标签，不能绑定");
        }

        Set<Long> targetTagIdSet = new LinkedHashSet<>(normalizedTagIds);
        Set<Long> existedTagIdSet = new LinkedHashSet<>();
        List<Long> deletedBindingIds = new ArrayList<>();
        for (ProjectTaskTag existingBinding : existingBindings) {
            existedTagIdSet.add(existingBinding.getTagId());
            if (!targetTagIdSet.contains(existingBinding.getTagId())) {
                deletedBindingIds.add(existingBinding.getId());
            }
        }
        if (!deletedBindingIds.isEmpty()) {
            projectTaskTagMapper.deleteBatchIds(deletedBindingIds);
        }

        List<ProjectTaskTag> createdBindings = new ArrayList<>();
        for (Long tagId : targetTagIdSet) {
            if (existedTagIdSet.contains(tagId)) {
                continue;
            }
            ProjectTaskTag taskTagBinding = new ProjectTaskTag();
            taskTagBinding.setTaskId(taskId);
            taskTagBinding.setTagId(tagId);
            createdBindings.add(taskTagBinding);
        }
        if (!createdBindings.isEmpty()) {
            for (ProjectTaskTag createdBinding : createdBindings) {
                projectTaskTagMapper.insert(createdBinding);
            }
        }
    }

    /**
     * 按任务 ID 批量查询标签。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到标签列表的映射
     */
    public Map<Long, List<ProjectTaskTagVo>> findTagMapByTaskIds(Collection<Long> taskIds) {
        if (CollectionUtils.isEmpty(taskIds)) {
            return Collections.emptyMap();
        }
        List<ProjectTaskTag> bindings = projectTaskTagMapper.selectList(new LambdaQueryWrapper<ProjectTaskTag>()
                .in(ProjectTaskTag::getTaskId, taskIds));
        if (bindings.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<Long> tagIds = new LinkedHashSet<>();
        for (ProjectTaskTag binding : bindings) {
            tagIds.add(binding.getTagId());
        }
        Map<Long, TaskTag> tagMap = getTagMap(tagIds);

        Map<Long, List<ProjectTaskTagVo>> taskTagMap = new LinkedHashMap<>();
        for (ProjectTaskTag binding : bindings) {
            TaskTag tag = tagMap.get(binding.getTagId());
            if (tag == null) {
                continue;
            }
            List<ProjectTaskTagVo> tags = taskTagMap.computeIfAbsent(binding.getTaskId(), key -> new ArrayList<>());
            tags.add(toTagVo(tag));
        }

        for (Map.Entry<Long, List<ProjectTaskTagVo>> entry : taskTagMap.entrySet()) {
            entry.getValue().sort(Comparator
                    .comparing(ProjectTaskTagVo::getSort, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(ProjectTaskTagVo::getId, Comparator.nullsLast(Comparator.naturalOrder())));
        }
        return taskTagMap;
    }

    /**
     * 按任务 ID 批量查询标签 ID。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到标签 ID 列表映射
     */
    public Map<Long, List<Long>> findTagIdMapByTaskIds(Collection<Long> taskIds) {
        Map<Long, List<ProjectTaskTagVo>> tagMap = findTagMapByTaskIds(taskIds);
        if (tagMap.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, List<Long>> taskTagIdMap = new LinkedHashMap<>();
        for (Map.Entry<Long, List<ProjectTaskTagVo>> entry : tagMap.entrySet()) {
            List<Long> tagIds = new ArrayList<>();
            for (ProjectTaskTagVo tagVo : entry.getValue()) {
                tagIds.add(tagVo.getId());
            }
            taskTagIdMap.put(entry.getKey(), tagIds);
        }
        return taskTagIdMap;
    }

    /**
     * 查询单个任务的标签 ID 列表。
     *
     * @param taskId 任务 ID
     * @return 标签 ID 列表
     */
    public List<Long> findTagIdsByTaskId(Long taskId) {
        Map<Long, List<Long>> taskTagIdMap = findTagIdMapByTaskIds(List.of(taskId));
        List<Long> tagIds = taskTagIdMap.get(taskId);
        if (tagIds == null) {
            return Collections.emptyList();
        }
        return tagIds;
    }

    /**
     * 按标签 ID 删除绑定关系。
     *
     * @param tagId 标签 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByTagId(Long tagId) {
        projectTaskTagMapper.delete(new LambdaQueryWrapper<ProjectTaskTag>()
                .eq(ProjectTaskTag::getTagId, tagId));
    }

    /**
     * 按任务 ID 删除绑定关系。
     *
     * @param taskId 任务 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByTaskId(Long taskId) {
        deleteByTaskIds(List.of(taskId));
    }

    /**
     * 按任务 ID 集合删除绑定关系。
     *
     * @param taskIds 任务 ID 集合
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByTaskIds(Collection<Long> taskIds) {
        if (CollectionUtils.isEmpty(taskIds)) {
            return;
        }
        projectTaskTagMapper.delete(new LambdaQueryWrapper<ProjectTaskTag>()
                .in(ProjectTaskTag::getTaskId, taskIds));
    }

    private void deleteBindings(List<ProjectTaskTag> bindings) {
        if (bindings.isEmpty()) {
            return;
        }
        List<Long> ids = new ArrayList<>();
        for (ProjectTaskTag binding : bindings) {
            ids.add(binding.getId());
        }
        projectTaskTagMapper.deleteBatchIds(ids);
    }

    private List<Long> normalizeTagIds(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> normalizedTagIds = new LinkedHashSet<>();
        for (Long tagId : tagIds) {
            if (tagId == null || tagId <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "标签 ID 不合法");
            }
            normalizedTagIds.add(tagId);
        }
        return new ArrayList<>(normalizedTagIds);
    }

    private Map<Long, TaskTag> getTenantTagMap(Long tenantId, List<Long> tagIds) {
        List<TaskTag> tags = taskTagMapper.selectList(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTenantId, tenantId)
                .in(TaskTag::getId, tagIds));
        Map<Long, TaskTag> tagMap = new LinkedHashMap<>();
        for (TaskTag tag : tags) {
            tagMap.put(tag.getId(), tag);
        }
        return tagMap;
    }

    private Map<Long, TaskTag> getTagMap(Set<Long> tagIds) {
        if (tagIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<TaskTag> tags = taskTagMapper.selectBatchIds(tagIds);
        if (tags.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, TaskTag> tagMap = new LinkedHashMap<>();
        for (TaskTag tag : tags) {
            tagMap.put(tag.getId(), tag);
        }
        return tagMap;
    }

    private ProjectTaskTagVo toTagVo(TaskTag tag) {
        return ProjectTaskTagVo.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .sort(tag.getSort())
                .build();
    }

    private ProjectTask requireTask(Long taskId) {
        ProjectTask task = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getId, taskId)
                .eq(ProjectTask::getDeleted, 0)
                .last("limit 1"));
        if (task == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务不存在");
        }
        return task;
    }

    private Project requireProject(Long projectId) {
        Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .eq(Project::getDeleted, 0)
                .last("limit 1"));
        if (project == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "项目不存在");
        }
        if (project.getTenantId() == null || project.getTenantId() <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "项目租户配置异常");
        }
        return project;
    }
}
