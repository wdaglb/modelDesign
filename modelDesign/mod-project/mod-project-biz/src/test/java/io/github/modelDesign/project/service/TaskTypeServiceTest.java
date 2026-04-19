package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.domain.TaskType;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.TaskTypeMapper;
import io.github.modelDesign.project.request.ProjectTaskTypeListRequest;
import io.github.modelDesign.project.response.ProjectTaskTypeVo;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 任务类型服务测试。
 */
class TaskTypeServiceTest {
    /**
     * 当租户首次访问任务类型列表时，应自动补齐默认类型。
     */
    @Test
    void getListShouldInitializeDefaultTypesWhenTenantHasNoTypes() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskTypeMapper taskTypeMapper = mock(TaskTypeMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskTypeService service = new TaskTypeService(
                authCurrentUserApi,
                taskTypeMapper,
                projectTaskMapper
        );

        List<TaskType> insertedTypes = new ArrayList<>();
        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskTypeMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            TaskType taskType = invocation.getArgument(0);
            taskType.setId((long) (insertedTypes.size() + 1));
            insertedTypes.add(taskType);
            return 1;
        }).when(taskTypeMapper).insert(any(TaskType.class));
        when(taskTypeMapper.selectList(any())).thenAnswer(invocation -> insertedTypes);

        List<ProjectTaskTypeVo> result = service.getList(new ProjectTaskTypeListRequest());

        assertEquals(2, result.size());
        assertEquals("任务", result.get(0).getName());
        assertEquals("缺陷", result.get(1).getName());
    }

    /**
     * 当任务类型仍被任务使用时，不允许删除。
     */
    @Test
    void deletedShouldRejectWhenTypeStillUsed() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        TaskTypeMapper taskTypeMapper = mock(TaskTypeMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        TaskTypeService service = new TaskTypeService(
                authCurrentUserApi,
                taskTypeMapper,
                projectTaskMapper
        );

        TaskType existedType = new TaskType();
        existedType.setId(11L);
        existedType.setTenantId(1001L);
        existedType.setName("任务");

        when(authCurrentUserApi.getCurrentUser())
                .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
        when(taskTypeMapper.selectCount(any())).thenReturn(1L);
        when(taskTypeMapper.selectOne(any())).thenReturn(existedType);
        when(projectTaskMapper.selectCount(any())).thenReturn(1L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.deleted(11L)
        );

        assertEquals("当前类型已被任务使用，不能删除", exception.getMessage());
    }
}
