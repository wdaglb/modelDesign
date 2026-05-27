package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.TaskStatusConfig;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskStatusConfigMapper;
import io.github.modelDesign.project.request.TaskStatusSaveItemRequest;
import io.github.modelDesign.project.request.TaskStatusSaveRequest;
import io.github.modelDesign.project.response.TaskStatusConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 任务状态配置服务。
 */
@Service
@RequiredArgsConstructor
public class TaskStatusConfigService extends ServiceImpl<TaskStatusConfigMapper, TaskStatusConfig> implements IService<TaskStatusConfig> {
    /**
     * 状态编码格式校验规则。
     */
    private static final Pattern STATUS_CODE_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_-]{0,31}$");

    /**
     * 项目任务 Mapper。
     */
    private final ProjectTaskMapper projectTaskMapper;

    /**
     * 获取任务状态配置列表。
     *
     * @return 任务状态配置列表
     */
    public List<TaskStatusConfigVo> getList() {
        List<TaskStatusConfig> configs = lambdaQuery()
                .orderByAsc(TaskStatusConfig::getSort)
                .orderByAsc(TaskStatusConfig::getId)
                .list();
        return toVoList(configs);
    }

    /**
     * 保存任务状态配置。
     *
     * @param request 保存请求
     * @return 保存后的状态配置列表
     */
    @Transactional(rollbackFor = Exception.class)
    public List<TaskStatusConfigVo> save(TaskStatusSaveRequest request) {
        List<TaskStatusSaveItemRequest> items = request.getStatuses();
        if (items == null || items.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态列表不能为空");
        }

        List<TaskStatusConfig> existingConfigs = lambdaQuery().list();
        Map<String, TaskStatusConfig> existingConfigMap = buildExistingConfigMap(existingConfigs);
        List<TaskStatusConfig> nextConfigs = buildNextConfigs(items, existingConfigMap);
        validateRemovedStatuses(existingConfigs, nextConfigs);

        List<Long> deletedIds = getDeletedIds(existingConfigs, nextConfigs);
        if (!deletedIds.isEmpty()) {
            removeByIds(deletedIds);
        }

        saveOrUpdateBatch(nextConfigs);
        return getList();
    }

    /**
     * 规范化并校验任务状态编码。
     *
     * @param statusCode 状态编码
     * @return 配置中实际保存的状态编码
     */
    public String normalizeAndRequireStatusCode(String statusCode) {
        String normalizedCode = normalizeStatusCode(statusCode);
        if (!StringUtils.hasText(normalizedCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务状态不合法");
        }

        TaskStatusConfig config = lambdaQuery()
                .apply("LOWER(\"code\") = {0}", normalizedCode.toLowerCase(Locale.ROOT))
                .last("limit 1")
                .one();
        if (config == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务状态不合法");
        }
        return config.getCode();
    }

    /**
     * 获取完成状态编码。
     *
     * @return 完成状态编码
     */
    public String getCompletedStatusCode() {
        TaskStatusConfig completedStatus = lambdaQuery()
                .eq(TaskStatusConfig::getIsCompleted, true)
                .orderByAsc(TaskStatusConfig::getSort)
                .orderByAsc(TaskStatusConfig::getId)
                .last("limit 1")
                .one();
        if (completedStatus == null || !StringUtils.hasText(completedStatus.getCode())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "未配置完成状态");
        }
        return completedStatus.getCode();
    }

    /**
     * 获取首个非完成状态编码。
     *
     * @return 首个非完成状态编码
     */
    public String getFirstNonCompletedStatusCode() {
        TaskStatusConfig pendingStatus = lambdaQuery()
                .eq(TaskStatusConfig::getIsCompleted, false)
                .orderByAsc(TaskStatusConfig::getSort)
                .orderByAsc(TaskStatusConfig::getId)
                .last("limit 1")
                .one();
        if (pendingStatus == null || !StringUtils.hasText(pendingStatus.getCode())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "未配置可流转状态");
        }
        return pendingStatus.getCode();
    }

    /**
     * 构建当前状态配置映射。
     *
     * @param existingConfigs 当前状态配置列表
     * @return 状态编码到配置实体的映射
     */
    private Map<String, TaskStatusConfig> buildExistingConfigMap(List<TaskStatusConfig> existingConfigs) {
        Map<String, TaskStatusConfig> existingConfigMap = new HashMap<>();
        for (TaskStatusConfig config : existingConfigs) {
            existingConfigMap.put(config.getCode().toLowerCase(Locale.ROOT), config);
        }
        return existingConfigMap;
    }

    /**
     * 构建待保存的状态配置列表。
     *
     * @param items 保存项列表
     * @param existingConfigMap 当前配置映射
     * @return 待保存的配置列表
     */
    private List<TaskStatusConfig> buildNextConfigs(List<TaskStatusSaveItemRequest> items, Map<String, TaskStatusConfig> existingConfigMap) {
        List<TaskStatusConfig> nextConfigs = new ArrayList<>();
        Set<String> duplicatedCodeSet = new HashSet<>();
        Set<String> duplicatedNameSet = new HashSet<>();
        int completedCount = 0;

        for (int index = 0; index < items.size(); index++) {
            TaskStatusSaveItemRequest item = items.get(index);
            String code = normalizeStatusCode(item.getCode());
            String name = normalizeStatusName(item.getName());
            validateSaveItem(code, name, duplicatedCodeSet, duplicatedNameSet);

            boolean completed = Boolean.TRUE.equals(item.getIsCompleted());
            if (completed) {
                completedCount++;
            }

            String codeKey = code.toLowerCase(Locale.ROOT);
            TaskStatusConfig config = existingConfigMap.get(codeKey);
            if (config == null) {
                config = new TaskStatusConfig();
            } else {
                code = config.getCode();
            }
            config.setCode(code);
            config.setName(name);
            config.setSort(index + 1);
            config.setIsCompleted(completed);
            config.setShowInAgileBoard(resolveShowInAgileBoard(item));
            nextConfigs.add(config);
        }

        if (completedCount != 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "必须且只能配置一个完成状态");
        }
        return nextConfigs;
    }

    /**
     * 校验单个保存项是否合法。
     *
     * @param code 状态编码
     * @param name 状态名称
     * @param duplicatedCodeSet 已出现的编码集合
     * @param duplicatedNameSet 已出现的名称集合
     */
    private void validateSaveItem(String code, String name, Set<String> duplicatedCodeSet, Set<String> duplicatedNameSet) {
        if (!StringUtils.hasText(code)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态编码不能为空");
        }
        if (!STATUS_CODE_PATTERN.matcher(code).matches()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态编码格式不合法");
        }
        if (!StringUtils.hasText(name)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态名称不能为空");
        }

        String codeKey = code.toLowerCase(Locale.ROOT);
        if (!duplicatedCodeSet.add(codeKey)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态编码不能重复");
        }

        String nameKey = name.toLowerCase(Locale.ROOT);
        if (!duplicatedNameSet.add(nameKey)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "状态名称不能重复");
        }
    }

    /**
     * 校验被删除的状态是否仍被任务使用。
     *
     * @param existingConfigs 当前配置列表
     * @param nextConfigs 待保存配置列表
     */
    private void validateRemovedStatuses(List<TaskStatusConfig> existingConfigs, List<TaskStatusConfig> nextConfigs) {
        Set<String> nextCodeSet = new HashSet<>();
        for (TaskStatusConfig config : nextConfigs) {
            nextCodeSet.add(config.getCode().toLowerCase(Locale.ROOT));
        }

        List<String> removedCodes = new ArrayList<>();
        for (TaskStatusConfig config : existingConfigs) {
            String codeKey = config.getCode().toLowerCase(Locale.ROOT);
            if (!nextCodeSet.contains(codeKey)) {
                removedCodes.add(config.getCode());
            }
        }

        if (removedCodes.isEmpty()) {
            return;
        }

        List<ProjectTask> usedTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
                .select(ProjectTask::getStatus)
                .eq(ProjectTask::getDeleted, 0)
                .in(ProjectTask::getStatus, removedCodes)
                .groupBy(ProjectTask::getStatus));
        if (usedTasks.isEmpty()) {
            return;
        }

        List<String> usedCodes = new ArrayList<>();
        for (ProjectTask task : usedTasks) {
            if (StringUtils.hasText(task.getStatus())) {
                usedCodes.add(task.getStatus());
            }
        }
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "以下状态仍被任务使用，不能删除：" + String.join("、", usedCodes));
    }

    /**
     * 获取需要删除的配置 ID 列表。
     *
     * @param existingConfigs 当前配置列表
     * @param nextConfigs 待保存配置列表
     * @return 需要删除的配置 ID 列表
     */
    private List<Long> getDeletedIds(List<TaskStatusConfig> existingConfigs, List<TaskStatusConfig> nextConfigs) {
        Set<Long> nextIdSet = new HashSet<>();
        for (TaskStatusConfig config : nextConfigs) {
            if (config.getId() != null) {
                nextIdSet.add(config.getId());
            }
        }

        List<Long> deletedIds = new ArrayList<>();
        for (TaskStatusConfig config : existingConfigs) {
            if (config.getId() == null) {
                continue;
            }
            if (!nextIdSet.contains(config.getId())) {
                deletedIds.add(config.getId());
            }
        }
        return deletedIds;
    }

    /**
     * 转换状态配置视图对象列表。
     *
     * @param configs 状态配置实体列表
     * @return 状态配置视图对象列表
     */
    private List<TaskStatusConfigVo> toVoList(List<TaskStatusConfig> configs) {
        List<TaskStatusConfigVo> result = new ArrayList<>();
        for (TaskStatusConfig config : configs) {
            result.add(TaskStatusConfigVo.builder()
                    .code(config.getCode())
                    .name(config.getName())
                    .sort(config.getSort())
                    .isCompleted(config.getIsCompleted())
                    .showInAgileBoard(resolveShowInAgileBoard(config))
                    .build());
        }
        return result;
    }

    /**
     * 解析保存请求中的敏捷面板显示标记。
     *
     * @param item 状态保存项
     * @return 是否显示在敏捷面板；兼容旧请求缺字段时默认显示
     */
    private Boolean resolveShowInAgileBoard(TaskStatusSaveItemRequest item) {
        if (item.getShowInAgileBoard() == null) {
            return true;
        }
        return item.getShowInAgileBoard();
    }

    /**
     * 解析实体中的敏捷面板显示标记。
     *
     * @param config 状态配置实体
     * @return 是否显示在敏捷面板；兼容历史数据缺字段时默认显示
     */
    private Boolean resolveShowInAgileBoard(TaskStatusConfig config) {
        if (config.getShowInAgileBoard() == null) {
            return true;
        }
        return config.getShowInAgileBoard();
    }

    /**
     * 规范化状态编码。
     *
     * @param code 原始状态编码
     * @return 去除首尾空格后的状态编码
     */
    private String normalizeStatusCode(String code) {
        if (code == null) {
            return null;
        }
        return code.trim();
    }

    /**
     * 规范化状态名称。
     *
     * @param name 原始状态名称
     * @return 去除首尾空格后的状态名称
     */
    private String normalizeStatusName(String name) {
        if (name == null) {
            return null;
        }
        return name.trim();
    }
}
