package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.TaskIteration;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskIterationMapper;
import io.github.modelDesign.project.request.TaskIterationCreateRequest;
import io.github.modelDesign.project.request.TaskIterationEditRequest;
import io.github.modelDesign.project.request.TaskIterationListRequest;
import io.github.modelDesign.project.response.TaskIterationVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

/**
 * 任务迭代服务。
 *
 * 迭代是租户级配置，任务通过 iterationId 显式绑定；这里集中处理
 * 租户隔离、日期范围合法性和重叠校验，避免看板与任务写入各自重复判断。
 */
@Service
@RequiredArgsConstructor
public class TaskIterationService {
    /**
     * 日期格式化器。
     */
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 任务迭代 Mapper。
     */
    private final TaskIterationMapper taskIterationMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 获取当前租户的迭代列表。
     *
     * @param request 列表请求
     * @return 迭代列表
     */
    public List<TaskIterationVo> getList(TaskIterationListRequest request) {
        Long tenantId = requireCurrentTenantId();
        String name = normalizeOptionalText(request.getName());
        List<TaskIteration> iterations = taskIterationMapper.selectList(
                new LambdaQueryWrapper<TaskIteration>()
                        .eq(TaskIteration::getTenantId, tenantId)
                        .like(StringUtils.hasText(name), TaskIteration::getName, name)
                        .orderByDesc(TaskIteration::getStartDate)
                        .orderByDesc(TaskIteration::getId)
        );
        if (iterations.isEmpty()) {
            return Collections.emptyList();
        }
        return iterations.stream().map(this::toVo).toList();
    }

    /**
     * 创建任务迭代。
     *
     * @param request 创建请求
     * @return 创建后的迭代
     */
    @Transactional(rollbackFor = Exception.class)
    public TaskIterationVo create(TaskIterationCreateRequest request) {
        Long tenantId = requireCurrentTenantId();
        String name = normalizeRequiredName(request.getName());
        validateDateRange(request.getStartDate(), request.getEndDate());
        validateNameDuplicated(tenantId, name, null);
        validateDateRangeNotOverlapped(
                tenantId,
                request.getStartDate(),
                request.getEndDate(),
                null
        );

        TaskIteration iteration = new TaskIteration();
        iteration.setTenantId(tenantId);
        iteration.setName(name);
        iteration.setStartDate(request.getStartDate());
        iteration.setEndDate(request.getEndDate());
        iteration.setPublished(normalizePublished(request.getPublished()));
        taskIterationMapper.insert(iteration);
        return toVo(iteration);
    }

    /**
     * 编辑任务迭代。
     *
     * @param id      迭代 ID
     * @param request 编辑请求
     * @return 编辑后的迭代
     */
    @Transactional(rollbackFor = Exception.class)
    public TaskIterationVo edit(Long id, TaskIterationEditRequest request) {
        Long tenantId = requireCurrentTenantId();
        TaskIteration iteration = requireIteration(id, tenantId);
        String name = normalizeRequiredName(request.getName());
        validateDateRange(request.getStartDate(), request.getEndDate());
        validateNameDuplicated(tenantId, name, id);
        validateDateRangeNotOverlapped(
                tenantId,
                request.getStartDate(),
                request.getEndDate(),
                id
        );

        iteration.setName(name);
        iteration.setStartDate(request.getStartDate());
        iteration.setEndDate(request.getEndDate());
        iteration.setPublished(resolvePublishedForEdit(
                request.getPublished(),
                iteration.getPublished()
        ));
        taskIterationMapper.updateById(iteration);
        return toVo(iteration);
    }

    /**
     * 删除任务迭代。
     *
     * @param id 迭代 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleted(Long id) {
        Long tenantId = requireCurrentTenantId();
        requireIteration(id, tenantId);
        validateIterationNotUsed(id);
        taskIterationMapper.deleteById(id);
    }

    /**
     * 校验并返回当前租户下的迭代 ID。
     *
     * @param iterationId 迭代 ID
     * @return 合法迭代 ID；未传时返回 null
     */
    public Long validateIterationId(Long iterationId) {
        if (iterationId == null || iterationId.equals(0L)) {
            return null;
        }
        Long tenantId = requireCurrentTenantId();
        return requireIteration(iterationId, tenantId).getId();
    }

    /**
     * 校验当前租户下迭代存在并返回实体。
     *
     * @param id       迭代 ID
     * @param tenantId 租户 ID
     * @return 迭代实体
     */
    public TaskIteration requireIteration(Long id, Long tenantId) {
        TaskIteration iteration = taskIterationMapper.selectOne(
                new LambdaQueryWrapper<TaskIteration>()
                        .eq(TaskIteration::getId, id)
                        .eq(TaskIteration::getTenantId, tenantId)
                        .last("limit 1")
        );
        if (iteration == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务迭代不存在");
        }
        return iteration;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "迭代日期不能为空");
        }
        if (startDate.isAfter(endDate)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "迭代开始日期不能晚于结束日期");
        }
    }

    private void validateDateRangeNotOverlapped(
            Long tenantId,
            LocalDate startDate,
            LocalDate endDate,
            Long excludeId) {
        LambdaQueryWrapper<TaskIteration> queryWrapper =
                new LambdaQueryWrapper<TaskIteration>()
                        .eq(TaskIteration::getTenantId, tenantId)
                        .le(TaskIteration::getStartDate, endDate)
                        .ge(TaskIteration::getEndDate, startDate);
        if (excludeId != null) {
            queryWrapper.ne(TaskIteration::getId, excludeId);
        }
        Long count = taskIterationMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "同一租户下迭代时间范围不能重叠");
        }
    }

    private void validateNameDuplicated(Long tenantId, String name, Long excludeId) {
        LambdaQueryWrapper<TaskIteration> queryWrapper =
                new LambdaQueryWrapper<TaskIteration>()
                        .eq(TaskIteration::getTenantId, tenantId)
                        .eq(TaskIteration::getName, name);
        if (excludeId != null) {
            queryWrapper.ne(TaskIteration::getId, excludeId);
        }
        Long count = taskIterationMapper.selectCount(queryWrapper);
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "同一租户下迭代名称不能重复");
        }
    }

    private void validateIterationNotUsed(Long iterationId) {
        Long count = projectTaskMapper.selectCount(
                new LambdaQueryWrapper<ProjectTask>()
                        .eq(ProjectTask::getIterationId, iterationId)
                        .eq(ProjectTask::getDeleted, 0)
        );
        if (count != null && count > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前迭代已被任务使用，不能删除");
        }
    }

    private String normalizeRequiredName(String value) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "迭代名称不能为空");
        }
        String normalizedValue = value.trim();
        if (normalizedValue.length() > 64) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "迭代名称长度不能超过 64 个字符");
        }
        return normalizedValue;
    }

    private String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private Long requireCurrentTenantId() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId <= 0) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户未绑定租户");
        }
        return tenantId;
    }

    private TaskIterationVo toVo(TaskIteration iteration) {
        return TaskIterationVo.builder()
                .id(iteration.getId())
                .name(iteration.getName())
                .startDate(formatDate(iteration.getStartDate()))
                .endDate(formatDate(iteration.getEndDate()))
                .published(normalizePublished(iteration.getPublished()))
                .build();
    }

    /**
     * 统一兜底发布状态，避免历史空值或旧客户端漏传导致空指针。
     *
     * @param published 发布状态
     * @return 非空发布状态
     */
    private Boolean normalizePublished(Boolean published) {
        if (published == null) {
            return false;
        }
        return published;
    }

    /**
     * 编辑时优先使用请求值；旧客户端未传该字段时保留原状态。
     *
     * @param requestValue 编辑请求中的发布状态
     * @param currentValue 当前迭代发布状态
     * @return 最终写入的发布状态
     */
    private Boolean resolvePublishedForEdit(Boolean requestValue, Boolean currentValue) {
        if (requestValue == null) {
            return normalizePublished(currentValue);
        }
        return requestValue;
    }

    private String formatDate(LocalDate value) {
        if (value == null) {
            return "";
        }
        return DATE_FORMATTER.format(value);
    }
}
