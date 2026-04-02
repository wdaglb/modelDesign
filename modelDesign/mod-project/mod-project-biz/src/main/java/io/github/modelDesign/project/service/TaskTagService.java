package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.TaskTag;
import io.github.modelDesign.project.mapper.TaskTagMapper;
import io.github.modelDesign.project.request.ProjectTaskTagCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskTagEditRequest;
import io.github.modelDesign.project.request.ProjectTaskTagListRequest;
import io.github.modelDesign.project.response.ProjectTaskTagVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

/**
 * 任务标签服务。
 */
@Service
@RequiredArgsConstructor
public class TaskTagService {
    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 标签 Mapper。
     */
    private final TaskTagMapper taskTagMapper;

    /**
     * 任务标签绑定服务。
     */
    private final ProjectTaskTagBindingService projectTaskTagBindingService;

    /**
     * 获取标签列表。
     *
     * @param request 列表请求
     * @return 标签列表
     */
    public List<ProjectTaskTagVo> getList(ProjectTaskTagListRequest request) {
        Long tenantId = requireCurrentTenantId();
        String name = normalizeOptionalText(request.getName());
        List<TaskTag> tags = taskTagMapper.selectList(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTenantId, tenantId)
                .like(StringUtils.hasText(name), TaskTag::getName, name)
                .orderByAsc(TaskTag::getSort)
                .orderByAsc(TaskTag::getId));
        if (tags.isEmpty()) {
            return Collections.emptyList();
        }
        return tags.stream().map(this::toTagVo).toList();
    }

    /**
     * 创建标签。
     *
     * @param request 创建请求
     * @return 标签详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskTagVo create(ProjectTaskTagCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        String name = normalizeRequiredText(request.getName(), 64, "标签名称不能为空", "标签名称长度不能超过 64 个字符");
        String color = normalizeOptionalText(request.getColor());
        Integer sort = normalizeSort(request.getSort());
        validateNameDuplicated(tenantId, name, null);

        TaskTag taskTag = new TaskTag();
        taskTag.setTenantId(tenantId);
        taskTag.setName(name);
        taskTag.setColor(color);
        taskTag.setSort(sort);
        taskTagMapper.insert(taskTag);
        return toTagVo(taskTag);
    }

    /**
     * 编辑标签。
     *
     * @param id      标签 ID
     * @param request 编辑请求
     * @return 标签详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskTagVo edit(Long id, ProjectTaskTagEditRequest request) {
        Long tenantId = requireCurrentTenantId();
        TaskTag taskTag = requireTag(id, tenantId);
        String name = normalizeRequiredText(request.getName(), 64, "标签名称不能为空", "标签名称长度不能超过 64 个字符");
        String color = normalizeOptionalText(request.getColor());
        Integer sort = normalizeSort(request.getSort());
        validateNameDuplicated(tenantId, name, id);

        taskTag.setName(name);
        taskTag.setColor(color);
        taskTag.setSort(sort);
        taskTagMapper.updateById(taskTag);
        return toTagVo(taskTag);
    }

    /**
     * 删除标签。
     *
     * @param id 标签 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleted(Long id) {
        Long tenantId = requireCurrentTenantId();
        requireTag(id, tenantId);
        projectTaskTagBindingService.deleteByTagId(id);
        taskTagMapper.deleteById(id);
    }

    /**
     * 校验并获取标签。
     *
     * @param id       标签 ID
     * @param tenantId 租户 ID
     * @return 标签实体
     */
    public TaskTag requireTag(Long id, Long tenantId) {
        TaskTag taskTag = taskTagMapper.selectOne(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getId, id)
                .eq(TaskTag::getTenantId, tenantId)
                .last("limit 1"));
        if (taskTag == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "标签不存在");
        }
        return taskTag;
    }

    private void validateNameDuplicated(Long tenantId, String name, Long excludeId) {
        LambdaQueryWrapper<TaskTag> queryWrapper = new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTenantId, tenantId)
                .eq(TaskTag::getName, name);
        if (excludeId != null) {
            queryWrapper.ne(TaskTag::getId, excludeId);
        }
        Long count = taskTagMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "同一租户下标签名称不能重复");
        }
    }

    private ProjectTaskTagVo toTagVo(TaskTag taskTag) {
        return ProjectTaskTagVo.builder()
                .id(taskTag.getId())
                .name(taskTag.getName())
                .color(taskTag.getColor())
                .sort(taskTag.getSort())
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
}
