package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.project.mapper.ProjectMemberMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 任务负责人校验测试。
 */
class ProjectTaskGuardServiceTest {
    /**
     * 已禁用用户不允许被设置为负责人。
     */
    @Test
    void validateAssigneeShouldRejectDisabledUser() {
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        when(authUserApi.getUserMapByIds(Set.of(12L))).thenReturn(Map.of(
                12L,
                AuthUserSimpleDto.builder()
                        .id(12L)
                        .nickname("禁用用户")
                        .isDisable(true)
                        .build()
        ));

        ProjectTaskGuardService service = new ProjectTaskGuardService(
                mock(TaskStatusConfigService.class),
                mock(TaskTypeService.class),
                authUserApi,
                mock(ProjectMemberMapper.class),
                mock(ProjectTaskMemberMapper.class),
                mock(ProjectTaskMapper.class)
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.validateAssignee(12L)
        );

        assertEquals("负责人已禁用，不能指派", exception.getMessage());
    }
}
