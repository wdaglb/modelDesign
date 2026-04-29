package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.TaskType;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskTypeMapper;
import io.github.modelDesign.project.request.ProjectTaskTypeCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeEditRequest;
import io.github.modelDesign.project.request.ProjectTaskTypeListRequest;
import io.github.modelDesign.project.response.ProjectTaskTypeVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

/**
 * 任务类型服务。
 */
@Service
@RequiredArgsConstructor
public class TaskTypeService {
    /**
     * 默认任务类型名称列表。
     *
     * 这里在租户首次使用任务类型能力时自动补齐基础类型，
     * 避免历史租户升级后因为未初始化数据而无法新建任务。
     */
    private static final List<String> DEFAULT_TYPE_NAME_LIST = List.of("任务", "缺陷");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 任务类型 Mapper。
     */
    private final TaskTypeMapper taskTypeMapper;

    /**
     * 项目任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 获取任务类型列表。
     *
     * @param request 列表请求
     * @return 类型列表
     */
    public List<ProjectTaskTypeVo> getList(ProjectTaskTypeListRequest request) {
        Long tenantId = requireCurrentTenantId();
        ensureDefaultTypes(tenantId);

        String name = normalizeOptionalText(request.getName());
        List<TaskType> taskTypes = taskTypeMapper.selectList(new LambdaQueryWrapper<TaskType>()
                .eq(TaskType::getTenantId, tenantId)
                .like(StringUtils.hasText(name), TaskType::getName, name)
                .orderByAsc(TaskType::getSort)
                .orderByAsc(TaskType::getId));
        if (taskTypes.isEmpty()) {
            return Collections.emptyList();
        }
        return taskTypes.stream().map(this::toTaskTypeVo).toList();
    }

    /**
     * 创建任务类型。
     *
     * @param request 创建请求
     * @return 类型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskTypeVo create(ProjectTaskTypeCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        ensureDefaultTypes(tenantId);

        String name = normalizeRequiredText(
                request.getName(),
                64,
                "类型名称不能为空",
                "类型名称长度不能超过 64 个字符"
        );
        Integer sort = normalizeSort(request.getSort());
        validateNameDuplicated(tenantId, name, null);

        TaskType taskType = new TaskType();
        taskType.setTenantId(tenantId);
        taskType.setName(name);
        taskType.setSort(sort);
        taskType.setGitBranchPrefixGroup(normalizeGitBranchPrefixGroup(
                request.getGitBranchPrefixGroup()
        ));
        taskTypeMapper.insert(taskType);
        return toTaskTypeVo(taskType);
    }

    /**
     * 编辑任务类型。
     *
     * @param id      类型 ID
     * @param request 编辑请求
     * @return 类型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskTypeVo edit(Long id, ProjectTaskTypeEditRequest request) {
        Long tenantId = requireCurrentTenantId();
        ensureDefaultTypes(tenantId);

        TaskType taskType = requireType(id, tenantId);
        String name = normalizeRequiredText(
                request.getName(),
                64,
                "类型名称不能为空",
                "类型名称长度不能超过 64 个字符"
        );
        Integer sort = normalizeSort(request.getSort());
        validateNameDuplicated(tenantId, name, id);

        taskType.setName(name);
        taskType.setSort(sort);
        taskType.setGitBranchPrefixGroup(normalizeGitBranchPrefixGroup(
                request.getGitBranchPrefixGroup()
        ));
        taskTypeMapper.updateById(taskType);
        return toTaskTypeVo(taskType);
    }

    /**
     * 删除任务类型。
     *
     * @param id 类型 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleted(Long id) {
        Long tenantId = requireCurrentTenantId();
        requireType(id, tenantId);
        validateTypeNotUsed(id);
        taskTypeMapper.deleteById(id);
    }

    /**
     * 校验任务类型并返回标准类型 ID。
     *
     * @param typeId 类型 ID
     * @return 合法类型 ID
     */
    public Long validateTypeId(Long typeId) {
        Long tenantId = requireCurrentTenantId();
        ensureDefaultTypes(tenantId);
        if (typeId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务类型不能为空");
        }
        return requireType(typeId, tenantId).getId();
    }

    /**
     * 校验并获取任务类型。
     *
     * @param id       类型 ID
     * @param tenantId 租户 ID
     * @return 类型实体
     */
    public TaskType requireType(Long id, Long tenantId) {
        TaskType taskType = taskTypeMapper.selectOne(new LambdaQueryWrapper<TaskType>()
                .eq(TaskType::getId, id)
                .eq(TaskType::getTenantId, tenantId)
                .last("limit 1"));
        if (taskType == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务类型不存在");
        }
        return taskType;
    }

    private void ensureDefaultTypes(Long tenantId) {
        Long count = taskTypeMapper.selectCount(new LambdaQueryWrapper<TaskType>()
                .eq(TaskType::getTenantId, tenantId));
        if (count != null && count > 0) {
            return;
        }

        for (int index = 0; index < DEFAULT_TYPE_NAME_LIST.size(); index++) {
            TaskType taskType = new TaskType();
            taskType.setTenantId(tenantId);
            taskType.setName(DEFAULT_TYPE_NAME_LIST.get(index));
            taskType.setSort(index + 1);
            taskType.setGitBranchPrefixGroup("");
            taskTypeMapper.insert(taskType);
        }
    }

    private void validateNameDuplicated(Long tenantId, String name, Long excludeId) {
        LambdaQueryWrapper<TaskType> queryWrapper = new LambdaQueryWrapper<TaskType>()
                .eq(TaskType::getTenantId, tenantId)
                .eq(TaskType::getName, name);
        if (excludeId != null) {
            queryWrapper.ne(TaskType::getId, excludeId);
        }
        Long count = taskTypeMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "同一租户下类型名称不能重复");
        }
    }

    private void validateTypeNotUsed(Long typeId) {
        Long count = projectTaskMapper.selectCount(new LambdaQueryWrapper<ProjectTask>()
                .eq(ProjectTask::getTypeId, typeId)
                .eq(ProjectTask::getDeleted, 0));
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前类型已被任务使用，不能删除");
        }
    }

    private ProjectTaskTypeVo toTaskTypeVo(TaskType taskType) {
        return ProjectTaskTypeVo.builder()
                .id(taskType.getId())
                .name(taskType.getName())
                .sort(taskType.getSort())
                .gitBranchPrefixGroup(normalizeGitBranchPrefixGroup(
                        taskType.getGitBranchPrefixGroup()
                ))
                .build();
    }

    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }

    private String normalizeRequiredText(String value, int maxLength, String blankMessage, String maxLengthMessage) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), blankMessage);
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > maxLength) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), maxLengthMessage);
        }
        return normalizedValue;
    }

    private String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private Integer normalizeSort(Integer sort) {
        if (sort == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "排序值不能为空");
        }
        if (sort < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "排序值不能小于 0");
        }
        return sort;
    }

    /**
     * 规范化 Git 分支前缀分组，允许任务类型显式留空，交由详情页决定回退提示。
     *
     * @param gitBranchPrefixGroup 原始分组值
     * @return 规范化后的分组值
     */
    private String normalizeGitBranchPrefixGroup(String gitBranchPrefixGroup) {
        if (!StringUtils.hasText(gitBranchPrefixGroup)) {
            return "";
        }
        return gitBranchPrefixGroup.trim();
    }
}
