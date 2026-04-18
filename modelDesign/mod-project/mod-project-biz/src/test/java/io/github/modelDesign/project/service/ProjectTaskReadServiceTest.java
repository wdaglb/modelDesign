package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.request.MyTodoListRequest;
import io.github.modelDesign.project.response.MyTodoItemVo;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDetailVo;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * 项目任务读模型测试。
 */
class ProjectTaskReadServiceTest {
    /**
     * ProjectTask 的 Lambda 表信息是否已初始化。
     */
    private static boolean projectTaskTableInfoInitialized = false;

    /**
     * Project 的 Lambda 表信息是否已初始化。
     */
    private static boolean projectTableInfoInitialized = false;

    /**
     * MapperBuilderAssistant 命名空间。
     */
    private static final String MAPPER_NAMESPACE = "ProjectTaskMapper";

    /**
     * MyBatis 配置。
     */
    private static final Configuration MYBATIS_CONFIGURATION = new Configuration();

    /**
     * MyBatis Builder 助手。
     */
    private static final MapperBuilderAssistant MYBATIS_ASSISTANT =
            new MapperBuilderAssistant(MYBATIS_CONFIGURATION, MAPPER_NAMESPACE);

    /**
     * Lambda 缓存初始化锁。
     */
    private static final Object TABLE_INFO_LOCK = new Object();

    static {
        MYBATIS_ASSISTANT.setCurrentNamespace(MAPPER_NAMESPACE);
    }

    /**
     * 初始化测试所需实体的 Lambda 缓存。
     */
    private static void ensureLambdaTableInfoInitialized() {
        synchronized (TABLE_INFO_LOCK) {
            if (!projectTaskTableInfoInitialized) {
                TableInfoHelper.initTableInfo(MYBATIS_ASSISTANT, ProjectTask.class);
                projectTaskTableInfoInitialized = true;
            }
            if (!projectTableInfoInitialized) {
                TableInfoHelper.initTableInfo(MYBATIS_ASSISTANT, Project.class);
                projectTableInfoInitialized = true;
            }
        }
    }

    /**
     * 初始化 ProjectTask 的 Lambda 缓存。
     */
    private static void ensureProjectTaskTableInfoInitialized() {
        ensureLambdaTableInfoInitialized();
    }

    /**
     * 初始化 Project 的 Lambda 缓存。
     */
    private static void ensureProjectTableInfoInitialized() {
        ensureLambdaTableInfoInitialized();
    }

    /**
     * 初始化全部 Lambda 缓存。
     */
    static {
        ensureLambdaTableInfoInitialized();
    }

    /**
     * TASK- 前缀编号应解析为任务 ID。
     */
    @Test
    void getDetailByVisibleNumberShouldSupportTaskPrefix() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask task = new ProjectTask();
        task.setId(2048L);
        task.setProjectId(100L);
        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(2048L).build();
        when(projectTaskMapper.selectOne(any())).thenReturn(task);
        when(projectTaskViewAssembler.toTaskVo(task)).thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByVisibleNumber("TASK-2048");

        assertSame(expected, result);
        verify(projectService).requireProject(100L);
        assertQueryWrapperContainsId(projectTaskMapper, 2048L);
    }

    /**
     * 任意项目编号前缀应解析为任务 ID。
     */
    @Test
    void getDetailByVisibleNumberShouldSupportProjectCodePrefix() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask task = new ProjectTask();
        task.setId(2048L);
        task.setProjectId(100L);
        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(2048L).build();
        when(projectTaskMapper.selectOne(any())).thenReturn(task);
        when(projectTaskViewAssembler.toTaskVo(task)).thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByVisibleNumber("DEMO-CODE-2048");

        assertSame(expected, result);
        verify(projectService).requireProject(100L);
        assertQueryWrapperContainsId(projectTaskMapper, 2048L);
    }

    /**
     * 纯数字编号应解析为任务 ID。
     */
    @Test
    void getDetailByVisibleNumberShouldSupportNumericCode() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask task = new ProjectTask();
        task.setId(2048L);
        task.setProjectId(101L);
        ProjectTaskDetailVo expected = ProjectTaskDetailVo.builder().id(2048L).build();
        when(projectTaskMapper.selectOne(any())).thenReturn(task);
        when(projectTaskViewAssembler.toTaskVo(task)).thenReturn(expected);

        ProjectTaskDetailVo result = service.getDetailByVisibleNumber("2048");

        assertSame(expected, result);
        verify(projectService).requireProject(101L);
        assertQueryWrapperContainsId(projectTaskMapper, 2048L);
    }

    /**
     * 非法格式编号应抛 400 异常。
     */
    @Test
    void getDetailByVisibleNumberShouldRejectInvalidCode() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getDetailByVisibleNumber("TASK-20A8"));

        assertEquals(400, exception.getStatus());
        assertEquals("任务编号不合法", exception.getMessage());
        verifyNoInteractions(projectTaskMapper);
    }

    /**
     * 查询不到任务应抛 404 异常。
     */
    @Test
    void getDetailByVisibleNumberShouldThrowWhenTaskMissing() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        when(projectTaskMapper.selectOne(any())).thenReturn(null);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getDetailByVisibleNumber("2048"));

        assertEquals(404, exception.getStatus());
        assertEquals("任务不存在", exception.getMessage());
        verifyNoInteractions(projectService);
    }

    /**
     * 批量子任务查询应返回读模型视图列表。
     */
    @Test
    void getChildrenBatchShouldReturnChildren() {
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskViewAssembler projectTaskViewAssembler = mock(ProjectTaskViewAssembler.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskReadService service = buildService(projectTaskMapper, projectTaskViewAssembler, projectService);

        ProjectTask parentTaskFirst = new ProjectTask();
        parentTaskFirst.setId(1L);
        ProjectTask parentTaskSecond = new ProjectTask();
        parentTaskSecond.setId(2L);

        ProjectTask childTask = new ProjectTask();
        childTask.setId(10L);
        childTask.setParentTaskId(1L);
        List<ProjectTask> children = List.of(childTask);
        List<ProjectTaskDetailVo> expected = List.of(ProjectTaskDetailVo.builder().id(10L).build());

        when(projectTaskMapper.selectList(any())).thenReturn(children);
        when(projectTaskViewAssembler.toTaskVoList(children)).thenReturn(expected);

        List<ProjectTaskDetailVo> result = service.getChildrenBatch(List.of(parentTaskFirst, parentTaskSecond));

        assertSame(expected, result);
        assertQueryWrapperContainsParentIds(projectTaskMapper, List.of(1L, 2L));
        verify(projectTaskViewAssembler).toTaskVoList(children);
    }

    /**
     * 我的待办应按优先级高到低、再按更新时间新到旧排序。
     */
    @Test
    void getMyTodoListShouldSortByPriorityDescThenUpdateTimeDesc() {
        ensureProjectTableInfoInitialized();

        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskDynamicService projectTaskDynamicService =
                mock(ProjectTaskDynamicService.class);

        ProjectTaskReadService service = new ProjectTaskReadService(
                authCurrentUserApi,
                authUserApi,
                mock(ProjectService.class),
                projectMapper,
                projectTaskMapper,
                mock(ProjectTaskGuardService.class),
                mock(ProjectTaskViewAssembler.class),
                projectTaskDynamicService
        );

        when(authCurrentUserApi.getCurrentUser()).thenReturn(AuthCurrentUserDto.builder()
                .userId(9L)
                .tenantId(100L)
                .build());
        Project project = new Project();
        project.setId(201L);
        project.setTenantId(100L);
        when(projectMapper.selectList(any())).thenReturn(List.of(project));

        Project projectWithName = new Project();
        projectWithName.setId(201L);
        projectWithName.setName("演示项目");


        ProjectTask highOld = new ProjectTask();
        highOld.setId(1L);
        highOld.setTitle("高优先级旧");
        highOld.setPriority("high");
        highOld.setStatus("todo");
        highOld.setAssigneeId(9L);
        highOld.setCreatorId(7L);
        highOld.setProjectId(201L);
        highOld.setCreateTime(LocalDateTime.of(2026, 4, 1, 10, 0, 0));
        highOld.setUpdateTime(LocalDateTime.of(2026, 4, 11, 10, 0, 0));

        ProjectTask highNew = new ProjectTask();
        highNew.setId(2L);
        highNew.setTitle("高优先级新");
        highNew.setPriority("high");
        highNew.setStatus("todo");
        highNew.setAssigneeId(9L);
        highNew.setCreatorId(7L);
        highNew.setProjectId(201L);
        highNew.setCreateTime(LocalDateTime.of(2026, 4, 1, 10, 0, 0));
        highNew.setUpdateTime(LocalDateTime.of(2026, 4, 12, 10, 0, 0));

        ProjectTask lowNewest = new ProjectTask();
        lowNewest.setId(3L);
        lowNewest.setTitle("低优先级最新");
        lowNewest.setPriority("low");
        lowNewest.setStatus("todo");
        lowNewest.setAssigneeId(9L);
        lowNewest.setCreatorId(7L);
        lowNewest.setProjectId(201L);
        lowNewest.setCreateTime(LocalDateTime.of(2026, 4, 1, 10, 0, 0));
        lowNewest.setUpdateTime(LocalDateTime.of(2026, 4, 13, 10, 0, 0));

        when(projectTaskMapper.selectList(any())).thenReturn(List.of(highOld, lowNewest, highNew));
        when(authUserApi.getUserMapByIds(any())).thenReturn(Map.of(
                7L,
                AuthUserSimpleDto.builder().id(7L).nickname("发起人").build()
        ));
        when(projectMapper.selectBatchIds(any())).thenReturn(List.of(projectWithName));
        when(projectTaskDynamicService.findLatestSummaryMapByTaskIds(any())).thenReturn(
                Map.of(
                        1L, "高优先级旧动态",
                        2L, "高优先级新动态",
                        3L, "低优先级最新动态"
                )
        );

        MyTodoListRequest request = new MyTodoListRequest();
        PageResponse<MyTodoItemVo> response = service.getMyTodoList(request);

        assertNotNull(response);
        assertEquals(3, response.getItems().size());
        assertEquals(2L, response.getItems().get(0).getId());
        assertEquals(1L, response.getItems().get(1).getId());
        assertEquals(3L, response.getItems().get(2).getId());
        assertEquals("高优先级新动态", response.getItems().get(0).getLatestDynamicSummary());
    }

    private ProjectTaskReadService buildService(ProjectTaskMapper projectTaskMapper,
                                                ProjectTaskViewAssembler projectTaskViewAssembler,
                                                ProjectService projectService) {
        return new ProjectTaskReadService(
                mock(AuthCurrentUserApi.class),
                mock(AuthUserApi.class),
                projectService,
                mock(ProjectMapper.class),
                projectTaskMapper,
                mock(ProjectTaskGuardService.class),
                projectTaskViewAssembler,
                mock(ProjectTaskDynamicService.class)
        );
    }

    /**
     * 校验查询条件中包含指定任务 ID。
     *
     * @param projectTaskMapper 任务 Mapper
     * @param expectedId        期望任务 ID
     */
    private void assertQueryWrapperContainsId(ProjectTaskMapper projectTaskMapper, Long expectedId) {
        ArgumentCaptor<LambdaQueryWrapper<ProjectTask>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(projectTaskMapper).selectOne(captor.capture());
        LambdaQueryWrapper<ProjectTask> wrapper = captor.getValue();
        ensureProjectTaskTableInfoInitialized();
        String sqlSegment = wrapper.getSqlSegment();
        Map<String, Object> params = wrapper.getParamNameValuePairs();
        String paramKey = extractEqualsParamKey(sqlSegment, "id");
        String debugMessage = "查询条件未包含 id = ? 语义，params=" + params + ", sql=" + sqlSegment;
        assertTrue(paramKey != null && params.containsKey(paramKey), debugMessage);
        Object paramValue = params.get(paramKey);
        assertEquals(expectedId.longValue(), toLongValue(paramValue), "任务 ID 参数值不匹配");
    }

    /**
     * 校验查询条件中包含批量父任务 ID。
     *
     * @param projectTaskMapper 任务 Mapper
     * @param expectedIds       期望父任务 ID 列表
     */
    private void assertQueryWrapperContainsParentIds(ProjectTaskMapper projectTaskMapper, List<Long> expectedIds) {
        ArgumentCaptor<LambdaQueryWrapper<ProjectTask>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(projectTaskMapper).selectList(captor.capture());
        LambdaQueryWrapper<ProjectTask> wrapper = captor.getValue();
        ensureProjectTaskTableInfoInitialized();
        String sqlSegment = wrapper.getSqlSegment();
        Map<String, Object> params = wrapper.getParamNameValuePairs();
        String debugMessage = "查询条件未包含父任务批量过滤，params=" + params + ", sql=" + sqlSegment;
        List<String> paramKeys = extractInParamKeys(sqlSegment, "parentTaskId");
        assertTrue(!paramKeys.isEmpty(), debugMessage);
        Set<Long> actualIds = resolveParamValues(params, paramKeys);
        assertEquals(new HashSet<>(expectedIds), actualIds, "父任务 ID 列表不匹配");

        String deletedParamKey = extractEqualsParamKey(sqlSegment, "deleted");
        String deletedMessage = "查询条件未包含 deleted = 0 语义，params=" + params + ", sql=" + sqlSegment;
        assertTrue(deletedParamKey != null && params.containsKey(deletedParamKey), deletedMessage);
        Object deletedValue = params.get(deletedParamKey);
        assertEquals(0L, toLongValue(deletedValue), "deleted 条件值不为 0");

        String loweredSegment = sqlSegment.toLowerCase();
        assertTrue(loweredSegment.contains("order by updatetime desc"), "查询条件未包含更新时间倒序");
    }

    /**
     * 获取等值条件中的参数 Key。
     *
     * @param sqlSegment SQL 片段
     * @param fieldName  字段名
     * @return 参数 Key
     */
    private String extractEqualsParamKey(String sqlSegment, String fieldName) {
        if (sqlSegment == null || fieldName == null) {
            return null;
        }
        Pattern pattern = Pattern.compile("(?i)(?<![A-Za-z0-9_])" + Pattern.quote(fieldName)
                + "(?![A-Za-z0-9_])\\s*=\\s*#\\{ew\\.paramNameValuePairs\\.(MPGENVAL\\d+)\\}");
        Matcher matcher = pattern.matcher(sqlSegment);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group(1);
    }

    /**
     * 获取 IN 条件中的参数 Key 列表。
     *
     * @param sqlSegment SQL 片段
     * @param fieldName  字段名
     * @return 参数 Key 列表
     */
    private List<String> extractInParamKeys(String sqlSegment, String fieldName) {
        if (sqlSegment == null || fieldName == null) {
            return List.of();
        }
        Pattern pattern = Pattern.compile("(?i)" + Pattern.quote(fieldName)
                + "\\s+in\\s*\\(([^)]+)\\)");
        Matcher matcher = pattern.matcher(sqlSegment);
        if (!matcher.find()) {
            return List.of();
        }
        String group = matcher.group(1);
        Matcher keyMatcher = Pattern.compile("MPGENVAL\\d+").matcher(group);
        List<String> keys = new java.util.ArrayList<>();
        while (keyMatcher.find()) {
            keys.add(keyMatcher.group());
        }
        return keys;
    }

    /**
     * 根据参数 Key 集合获取实际数值集合。
     *
     * @param params 参数映射
     * @param keys   参数 Key 列表
     * @return 数值集合
     */
    private Set<Long> resolveParamValues(Map<String, Object> params, List<String> keys) {
        Set<Long> values = new HashSet<>();
        for (String key : keys) {
            Object value = params.get(key);
            if (value == null) {
                continue;
            }
            Long longValue = toLongValue(value);
            if (longValue != null) {
                values.add(longValue);
            }
        }
        return values;
    }

    /**
     * 转换为 Long 值。
     *
     * @param value 原始值
     * @return Long 值
     */
    private Long toLongValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }

}
