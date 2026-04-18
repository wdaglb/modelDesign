package io.github.modelDesign.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskDynamic;
import io.github.modelDesign.project.mapper.ProjectTaskDynamicMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.request.ProjectTaskDynamicCreateRequest;
import io.github.modelDesign.project.request.ProjectTaskDynamicListRequest;
import io.github.modelDesign.project.response.PageResponse;
import io.github.modelDesign.project.response.ProjectTaskDynamicItemVo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 任务动态服务测试。
 */
class ProjectTaskDynamicServiceTest {
    /**
     * 创建动态时应归一化内容并回填当前发布人信息。
     */
    @Test
    void createShouldTrimContentAndReturnCreatedItem() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectTaskDynamicMapper projectTaskDynamicMapper =
                mock(ProjectTaskDynamicMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDynamicService service = new ProjectTaskDynamicService(
                authCurrentUserApi,
                authUserApi,
                projectTaskDynamicMapper,
                projectTaskMapper,
                projectService
        );

        ProjectTask task = new ProjectTask();
        task.setId(501L);
        task.setProjectId(101L);
        when(projectTaskMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(task);
        when(projectService.requireProject(101L)).thenReturn(null);
        when(authCurrentUserApi.getCurrentUser()).thenReturn(
                AuthCurrentUserDto.builder()
                        .userId(7001L)
                        .nickname("产品经理")
                        .build()
        );
        doAnswer(invocation -> {
            ProjectTaskDynamic item = invocation.getArgument(0);
            item.setId(9001L);
            item.setCreateTime(LocalDateTime.of(2026, 4, 19, 12, 30, 45));
            return 1;
        }).when(projectTaskDynamicMapper).insert(any(ProjectTaskDynamic.class));

        ProjectTaskDynamicCreateRequest request = new ProjectTaskDynamicCreateRequest();
        request.setTaskId(501L);
        request.setContent("  已完成接口联调，等待测试回归。  ");

        ProjectTaskDynamicItemVo result = service.create(request);

        assertEquals(9001L, result.getId());
        assertEquals(501L, result.getTaskId());
        assertEquals("已完成接口联调，等待测试回归。", result.getContent());
        assertEquals(7001L, result.getOperatorId());
        assertEquals("产品经理", result.getOperatorName());
        assertEquals("2026-04-19 12:30:45", result.getCreatedAt());
        verify(projectTaskDynamicMapper).insert(any(ProjectTaskDynamic.class));
    }

    /**
     * 列表查询应沿用任务校验并返回分页数据。
     */
    @Test
    void getListShouldReturnPagedItems() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectTaskDynamicMapper projectTaskDynamicMapper =
                mock(ProjectTaskDynamicMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDynamicService service = new ProjectTaskDynamicService(
                authCurrentUserApi,
                authUserApi,
                projectTaskDynamicMapper,
                projectTaskMapper,
                projectService
        );

        ProjectTask task = new ProjectTask();
        task.setId(501L);
        task.setProjectId(101L);
        when(projectTaskMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(task);
        when(projectService.requireProject(101L)).thenReturn(null);
        ProjectTaskDynamic first = new ProjectTaskDynamic();
        first.setId(11L);
        first.setTaskId(501L);
        first.setContent("第一条动态");
        first.setOperatorId(7001L);
        first.setCreateTime(LocalDateTime.of(2026, 4, 19, 15, 0, 0));
        ProjectTaskDynamic second = new ProjectTaskDynamic();
        second.setId(12L);
        second.setTaskId(501L);
        second.setContent("第二条动态");
        second.setOperatorId(7002L);
        second.setCreateTime(LocalDateTime.of(2026, 4, 18, 10, 0, 0));
        when(projectTaskDynamicMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(first, second));
        when(authUserApi.getUserMapByIds(any())).thenReturn(
                Map.of(
                        7001L,
                        AuthUserSimpleDto.builder()
                                .id(7001L)
                                .nickname("张三")
                                .build(),
                        7002L,
                        AuthUserSimpleDto.builder()
                                .id(7002L)
                                .nickname("李四")
                                .build()
                )
        );

        ProjectTaskDynamicListRequest request = new ProjectTaskDynamicListRequest();
        request.setTaskId(501L);
        request.setCurrent(2);
        request.setPageSize(1);

        PageResponse<ProjectTaskDynamicItemVo> result = service.getList(request);

        assertEquals(2L, result.getTotal());
        assertEquals(1, result.getItems().size());
        ProjectTaskDynamicItemVo item = result.getItems().get(0);
        assertEquals(12L, item.getId());
        assertEquals("第二条动态", item.getContent());
        assertEquals("李四", item.getOperatorName());
        verify(projectTaskMapper).selectOne(any(LambdaQueryWrapper.class));
    }

    /**
     * 批量查询最新动态摘要时，应只保留每个任务最新的一条。
     */
    @Test
    void findLatestSummaryMapByTaskIdsShouldKeepLatestItemPerTask() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectTaskDynamicMapper projectTaskDynamicMapper =
                mock(ProjectTaskDynamicMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectService projectService = mock(ProjectService.class);
        ProjectTaskDynamicService service = new ProjectTaskDynamicService(
                authCurrentUserApi,
                authUserApi,
                projectTaskDynamicMapper,
                projectTaskMapper,
                projectService
        );

        ProjectTaskDynamic newest = new ProjectTaskDynamic();
        newest.setId(31L);
        newest.setTaskId(501L);
        newest.setContent("最新动态");
        newest.setCreateTime(LocalDateTime.of(2026, 4, 19, 18, 0, 0));
        ProjectTaskDynamic older = new ProjectTaskDynamic();
        older.setId(30L);
        older.setTaskId(501L);
        older.setContent("旧动态");
        older.setCreateTime(LocalDateTime.of(2026, 4, 18, 18, 0, 0));
        ProjectTaskDynamic anotherTask = new ProjectTaskDynamic();
        anotherTask.setId(40L);
        anotherTask.setTaskId(502L);
        anotherTask.setContent("任务 502 动态");
        anotherTask.setCreateTime(LocalDateTime.of(2026, 4, 17, 18, 0, 0));
        when(projectTaskDynamicMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(newest, older, anotherTask));

        Map<Long, String> result = service.findLatestSummaryMapByTaskIds(
                List.of(501L, 502L)
        );

        assertEquals(2, result.size());
        assertEquals("最新动态", result.get(501L));
        assertEquals("任务 502 动态", result.get(502L));
    }
}
