package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskDynamic;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskDynamicMapper;
import io.github.modelDesign.project.request.ProjectTaskDynamicCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDynamicListRequest;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDynamicItemVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 任务动态服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectTaskDynamicService {
    /**
     * 动态时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 当前登录用户接口。
     */
    private final AuthCurrentUserApi authCurrentUserApi;

    /**
     * 用户查询接口。
     */
    private final AuthUserApi authUserApi;

    /**
     * 任务动态 Mapper。
     */
    private final ProjectTaskDynamicMapper projectTaskDynamicMapper;

    /**
     * 任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 项目服务。
     */
    private final ProjectService projectService;

    /**
     * 获取任务动态列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    public PageResponse<ProjectTaskDynamicItemVo> getList(
            ProjectTaskDynamicListRequest request) {
        requireTask(request.getTaskId());
        List<ProjectTaskDynamic> allItems =
                projectTaskDynamicMapper.selectList(
                        new LambdaQueryWrapper<ProjectTaskDynamic>()
                                .eq(ProjectTaskDynamic::getTaskId,
                                        request.getTaskId())
                                .orderByDesc(ProjectTaskDynamic::getCreateTime)
                                .orderByDesc(ProjectTaskDynamic::getId));
        long total = allItems.size();
        long current = request.getCurrent();
        long pageSize = request.getPageSize();
        long fromIndex = Math.max((current - 1L) * pageSize, 0L);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + pageSize, total);
        List<ProjectTaskDynamic> pageItems = allItems.subList(
                (int) fromIndex,
                (int) toIndex
        );
        return new PageResponse<>(toItemVoList(pageItems), total);
    }

    /**
     * 创建任务动态。
     *
     * @param request 创建请求
     * @return 动态详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ProjectTaskDynamicItemVo create(ProjectTaskDynamicCreateRequest request) {
        requireTask(request.getTaskId());
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        Long operatorId = currentUser.getUserId();
        if (operatorId == null || operatorId <= 0) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED.value(),
                    "当前登录用户无效"
            );
        }

        ProjectTaskDynamic taskDynamic = new ProjectTaskDynamic();
        taskDynamic.setTaskId(request.getTaskId());
        taskDynamic.setContent(normalizeContent(request.getContent()));
        taskDynamic.setOperatorId(operatorId);
        projectTaskDynamicMapper.insert(taskDynamic);

        return ProjectTaskDynamicItemVo.builder()
                .id(taskDynamic.getId())
                .taskId(taskDynamic.getTaskId())
                .content(taskDynamic.getContent())
                .operatorId(taskDynamic.getOperatorId())
                .operatorName(resolveCurrentOperatorName(currentUser))
                .createdAt(formatDateTime(taskDynamic.getCreateTime()))
                .build();
    }

    /**
     * 批量获取任务的最新动态摘要映射。
     *
     * 这里按任务 ID 进行一次性查询，
     * 然后在内存中为每个任务挑选时间最新的一条动态，避免列表场景逐条补查。
     *
     * @param taskIds 任务 ID 集合
     * @return 任务 ID 到最新动态摘要的映射
     */
    public Map<Long, String> findLatestSummaryMapByTaskIds(Collection<Long> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<Long> normalizedTaskIds = new LinkedHashSet<>();
        for (Long taskId : taskIds) {
            if (taskId != null) {
                normalizedTaskIds.add(taskId);
            }
        }
        if (normalizedTaskIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ProjectTaskDynamic> dynamics = projectTaskDynamicMapper.selectList(
                new LambdaQueryWrapper<ProjectTaskDynamic>()
                        .in(ProjectTaskDynamic::getTaskId, normalizedTaskIds)
                        .orderByDesc(ProjectTaskDynamic::getCreateTime)
                        .orderByDesc(ProjectTaskDynamic::getId)
        );
        if (dynamics.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, String> latestSummaryMap = new LinkedHashMap<>();
        for (ProjectTaskDynamic dynamic : dynamics) {
            Long taskId = dynamic.getTaskId();
            if (taskId == null || latestSummaryMap.containsKey(taskId)) {
                continue;
            }
            latestSummaryMap.put(taskId, dynamic.getContent());
        }
        return latestSummaryMap;
    }

    /**
     * 将动态实体转换为视图对象列表。
     *
     * @param items 动态实体列表
     * @return 视图对象列表
     */
    private List<ProjectTaskDynamicItemVo> toItemVoList(
            List<ProjectTaskDynamic> items) {
        if (items.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> operatorIds = items.stream()
                .map(ProjectTaskDynamic::getOperatorId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        Map<Long, String> operatorNameMap = getOperatorNameMap(operatorIds);
        List<ProjectTaskDynamicItemVo> result = new ArrayList<>();
        for (ProjectTaskDynamic item : items) {
            result.add(ProjectTaskDynamicItemVo.builder()
                    .id(item.getId())
                    .taskId(item.getTaskId())
                    .content(item.getContent())
                    .operatorId(item.getOperatorId())
                    .operatorName(
                            operatorNameMap.getOrDefault(item.getOperatorId(),
                                    "-")
                    )
                    .createdAt(formatDateTime(item.getCreateTime()))
                    .build());
        }
        return result;
    }

    /**
     * 获取用户昵称映射。
     *
     * @param operatorIds 用户 ID 集合
     * @return 用户昵称映射
     */
    private Map<Long, String> getOperatorNameMap(Set<Long> operatorIds) {
        if (operatorIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, AuthUserSimpleDto> userMap =
                authUserApi.getUserMapByIds(operatorIds);
        Map<Long, String> result = new LinkedHashMap<>();
        for (Long operatorId : operatorIds) {
            AuthUserSimpleDto user = userMap.get(operatorId);
            if (user != null && StringUtils.hasText(user.getNickname())) {
                result.put(operatorId, user.getNickname().trim());
            } else {
                result.put(operatorId, "用户#" + operatorId);
            }
        }
        return result;
    }

    /**
     * 解析当前登录用户名称。
     *
     * @param currentUser 当前登录用户
     * @return 用户名称
     */
    private String resolveCurrentOperatorName(AuthCurrentUserDto currentUser) {
        if (StringUtils.hasText(currentUser.getNickname())) {
            return currentUser.getNickname().trim();
        }
        return "用户#" + currentUser.getUserId();
    }

    /**
     * 规范化动态内容。
     *
     * @param content 原始内容
     * @return 规范化后的内容
     */
    private String normalizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "动态内容不能为空"
            );
        }

        String normalizedContent = content.trim();
        if (normalizedContent.length() > 1000) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "动态内容长度不能超过 1000 个字符"
            );
        }
        return normalizedContent;
    }

    /**
     * 格式化时间。
     *
     * @param value 时间值
     * @return 时间文本
     */
    private String formatDateTime(java.time.LocalDateTime value) {
        if (value == null) {
            return "-";
        }
        return DATE_TIME_FORMATTER.format(value);
    }

    /**
     * 校验并获取任务。
     *
     * 动态服务只需要校验任务存在且项目仍可访问，
     * 这里直接复用 Mapper 与项目服务，避免依赖任务主服务形成循环注入。
     *
     * @param taskId 任务 ID
     * @return 任务实体
     */
    private ProjectTask requireTask(Long taskId) {
        ProjectTask task = projectTaskMapper.selectOne(
                new LambdaQueryWrapper<ProjectTask>()
                        .eq(ProjectTask::getId, taskId)
                        .eq(ProjectTask::getDeleted, 0)
                        .last("limit 1")
        );
        if (task == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务不存在");
        }
        projectService.requireProject(task.getProjectId());
        return task;
    }
}
