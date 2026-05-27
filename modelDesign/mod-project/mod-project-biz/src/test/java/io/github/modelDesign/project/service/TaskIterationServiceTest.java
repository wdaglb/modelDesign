package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.TaskIteration;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskIterationMapper;
import io.github.modelDesign.project.request.TaskIterationCreateRequest;
import io.github.modelDesign.project.request.TaskIterationEditRequest;
import io.github.modelDesign.project.response.TaskIterationVo;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 任务迭代服务测试。
 */
class TaskIterationServiceTest {
    /**
     * 创建迭代时应保存租户、名称和日期范围。
     */
    @Test
    void createShouldPersistTenantAndDateRange() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectCount(any())).thenReturn(0L, 0L);
        doAnswer(invocation -> {
            TaskIteration iteration = invocation.getArgument(0);
            iteration.setId(88L);
            return 1;
        }).when(taskIterationMapper).insert(any(TaskIteration.class));

        TaskIterationCreateRequest request = new TaskIterationCreateRequest();
        request.setName("  五月迭代  ");
        request.setStartDate(LocalDate.of(2026, 5, 1));
        request.setEndDate(LocalDate.of(2026, 5, 15));

        TaskIterationVo result = service.create(request);

        assertEquals(88L, result.getId());
        assertEquals("五月迭代", result.getName());
        assertEquals("2026-05-01", result.getStartDate());
        assertEquals("2026-05-15", result.getEndDate());
        assertEquals(false, result.getPublished());
    }

    /**
     * 创建迭代时名称不能为空。
     */
    @Test
    void createShouldRejectBlankName() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());

        TaskIterationCreateRequest request = new TaskIterationCreateRequest();
        request.setName(" ");
        request.setStartDate(LocalDate.of(2026, 5, 1));
        request.setEndDate(LocalDate.of(2026, 5, 15));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.create(request)
        );

        assertEquals("迭代名称不能为空", exception.getMessage());
    }

    /**
     * 创建迭代时开始日期不能晚于结束日期。
     */
    @Test
    void createShouldRejectInvalidDateRange() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());

        TaskIterationCreateRequest request = new TaskIterationCreateRequest();
        request.setName("五月迭代");
        request.setStartDate(LocalDate.of(2026, 5, 16));
        request.setEndDate(LocalDate.of(2026, 5, 15));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.create(request)
        );

        assertEquals("迭代开始日期不能晚于结束日期", exception.getMessage());
    }

    /**
     * 同租户迭代名称重复时应拒绝保存。
     */
    @Test
    void createShouldRejectDuplicatedName() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectCount(any())).thenReturn(1L);

        TaskIterationCreateRequest request = new TaskIterationCreateRequest();
        request.setName("五月迭代");
        request.setStartDate(LocalDate.of(2026, 5, 1));
        request.setEndDate(LocalDate.of(2026, 5, 15));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.create(request)
        );

        assertEquals("同一租户下迭代名称不能重复", exception.getMessage());
    }

    /**
     * 同租户迭代日期范围重叠时应拒绝保存。
     */
    @Test
    void createShouldRejectOverlappedDateRange() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectCount(any())).thenReturn(0L, 1L);

        TaskIterationCreateRequest request = new TaskIterationCreateRequest();
        request.setName("五月迭代");
        request.setStartDate(LocalDate.of(2026, 5, 1));
        request.setEndDate(LocalDate.of(2026, 5, 15));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.create(request)
        );

        assertEquals("同一租户下迭代时间范围不能重叠", exception.getMessage());
    }

    /**
     * 已被任务绑定的迭代不能删除。
     */
    @Test
    void deletedShouldRejectWhenIterationStillUsed() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        TaskIteration iteration = new TaskIteration();
        iteration.setId(88L);
        iteration.setTenantId(1001L);
        iteration.setName("五月迭代");
        iteration.setPublished(false);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectOne(any())).thenReturn(iteration);
        when(projectTaskMapper.selectCount(any())).thenReturn(1L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.deleted(88L)
        );

        assertEquals("当前迭代已被任务使用，不能删除", exception.getMessage());
    }

    /**
     * 编辑迭代时应保留租户隔离并更新名称与日期范围。
     */
    @Test
    void editShouldUpdateNameAndDateRange() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        TaskIteration iteration = new TaskIteration();
        iteration.setId(88L);
        iteration.setTenantId(1001L);
        iteration.setName("五月迭代");
        iteration.setStartDate(LocalDate.of(2026, 5, 1));
        iteration.setEndDate(LocalDate.of(2026, 5, 15));
        iteration.setPublished(false);

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectOne(any())).thenReturn(iteration);
        when(taskIterationMapper.selectCount(any())).thenReturn(0L, 0L);

        TaskIterationEditRequest request = new TaskIterationEditRequest();
        request.setName("  六月迭代  ");
        request.setStartDate(LocalDate.of(2026, 6, 1));
        request.setEndDate(LocalDate.of(2026, 6, 15));
        request.setPublished(true);

        TaskIterationVo result = service.edit(88L, request);

        assertEquals("六月迭代", result.getName());
        assertEquals("2026-06-01", result.getStartDate());
        assertEquals("2026-06-15", result.getEndDate());
        assertEquals(true, result.getPublished());
        verify(taskIterationMapper).updateById(iteration);
    }

    /**
     * 未被任务绑定的迭代允许删除。
     */
    @Test
    void deletedShouldDeleteWhenIterationNotUsed() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        TaskIteration iteration = new TaskIteration();
        iteration.setId(88L);
        iteration.setTenantId(1001L);
        iteration.setName("五月迭代");
        iteration.setPublished(false);
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectOne(any())).thenReturn(iteration);
        when(projectTaskMapper.selectCount(any())).thenReturn(0L);

        service.deleted(88L);

        verify(taskIterationMapper).deleteById(88L);
    }

    /**
     * 编辑请求未显式传发布状态时应保留原值。
     */
    @Test
    void editShouldKeepPublishedWhenRequestValueMissing() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskIterationMapper taskIterationMapper = mock(TaskIterationMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskIterationService service = new TaskIterationService(
                authCurrentUserApi,
                taskIterationMapper,
                projectTaskMapper
        );

        TaskIteration iteration = new TaskIteration();
        iteration.setId(99L);
        iteration.setTenantId(1001L);
        iteration.setName("六月迭代");
        iteration.setStartDate(LocalDate.of(2026, 6, 1));
        iteration.setEndDate(LocalDate.of(2026, 6, 15));
        iteration.setPublished(true);

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskIterationMapper.selectOne(any())).thenReturn(iteration);
        when(taskIterationMapper.selectCount(any())).thenReturn(0L, 0L);

        TaskIterationEditRequest request = new TaskIterationEditRequest();
        request.setName("六月迭代");
        request.setStartDate(LocalDate.of(2026, 6, 1));
        request.setEndDate(LocalDate.of(2026, 6, 15));

        TaskIterationVo result = service.edit(99L, request);

        assertEquals(true, result.getPublished());
    }
}
