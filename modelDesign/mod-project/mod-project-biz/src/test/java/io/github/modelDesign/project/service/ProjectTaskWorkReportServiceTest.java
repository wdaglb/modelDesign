package io.github.modelDesign.project.service;

import io.github.modelDesign.auth.api.AuthCurrentUserApi;
import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.api.dto.AuthUserSimpleDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.domain.Project;
import io.github.modelDesign.project.domain.ProjectTask;
import io.github.modelDesign.project.domain.ProjectTaskDynamic;
import io.github.modelDesign.project.domain.ProjectTaskMember;
import io.github.modelDesign.project.mapper.ProjectMapper;
import io.github.modelDesign.project.mapper.ProjectTaskDynamicMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMapper;
import io.github.modelDesign.project.mapper.ProjectTaskMemberMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 工作汇报服务测试。
 */
class ProjectTaskWorkReportServiceTest {
    /**
     * 日报应按任务成员参与度纳入任务，并补充当天动态。
     */
    @Test
    void dailyReportShouldIncludeMemberTaskAndDynamics() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskMemberMapper projectTaskMemberMapper =
                mock(ProjectTaskMemberMapper.class);
        ProjectTaskDynamicMapper projectTaskDynamicMapper =
                mock(ProjectTaskDynamicMapper.class);

        ProjectTaskWorkReportService service = new ProjectTaskWorkReportService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                projectTaskMapper,
                projectTaskMemberMapper,
                projectTaskDynamicMapper
        );

        when(authCurrentUserApi.getCurrentUser()).thenReturn(
                AuthCurrentUserDto.builder()
                        .userId(7L)
                        .tenantId(99L)
                        .build()
        );
        when(projectMapper.selectList(any())).thenReturn(List.of(project(11L, 99L, "平台项目")));
        when(projectTaskMemberMapper.selectList(any())).thenReturn(
                List.of(member(200L, 7L))
        );
        when(projectTaskMapper.selectList(any()))
                .thenReturn(List.of(task(
                        200L,
                        11L,
                        "补充成员汇报",
                        "inProgress",
                        "high",
                        8L,
                        LocalDateTime.of(2026, 4, 22, 19, 0, 0),
                        LocalDateTime.of(2026, 4, 20, 9, 0, 0)
                )));
        when(projectTaskDynamicMapper.selectList(any())).thenReturn(
                List.of(dynamic(
                        200L,
                        7L,
                        "今天已同步测试风险与解决方案",
                        LocalDateTime.of(2026, 4, 22, 18, 0, 0)
                ))
        );
        when(authUserApi.getUserMapByIds(any(Set.class))).thenReturn(Map.of(
                7L,
                AuthUserSimpleDto.builder()
                        .id(7L)
                        .nickname("张三")
                        .build()
        ));

        ProjectTaskWorkReportCommand command = new ProjectTaskWorkReportCommand();
        command.setReportType("daily");
        command.setReferenceDate(LocalDate.of(2026, 4, 22));

        ProjectTaskWorkReportDto result = service.generateCurrentUserReport(command);

        assertEquals(1, result.getTasks().size());
        assertEquals("成员", result.getTasks().get(0).getParticipationRole());
        assertEquals(1, result.getDynamics().size());
        assertEquals("今天已同步测试风险与解决方案",
                result.getDynamics().get(0).getContent());
    }

    /**
     * 周报应只为未完成任务补充动态，已完成任务的动态不再单独展开。
     */
    @Test
    void weeklyReportShouldOnlyIncludeDynamicsForUnfinishedTasks() {
        AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
        AuthUserApi authUserApi = mock(AuthUserApi.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        ProjectTaskMapper projectTaskMapper = mock(ProjectTaskMapper.class);
        ProjectTaskMemberMapper projectTaskMemberMapper =
                mock(ProjectTaskMemberMapper.class);
        ProjectTaskDynamicMapper projectTaskDynamicMapper =
                mock(ProjectTaskDynamicMapper.class);

        ProjectTaskWorkReportService service = new ProjectTaskWorkReportService(
                authCurrentUserApi,
                authUserApi,
                projectMapper,
                projectTaskMapper,
                projectTaskMemberMapper,
                projectTaskDynamicMapper
        );

        when(authCurrentUserApi.getCurrentUser()).thenReturn(
                AuthCurrentUserDto.builder()
                        .userId(7L)
                        .tenantId(99L)
                        .build()
        );
        when(projectMapper.selectList(any())).thenReturn(List.of(project(11L, 99L, "平台项目")));
        when(projectTaskMemberMapper.selectList(any())).thenReturn(List.of());
        when(projectTaskMapper.selectList(any()))
                .thenReturn(List.of(
                        task(
                                201L,
                                11L,
                                "持续推进中的任务",
                                "inProgress",
                                "medium",
                                7L,
                                LocalDateTime.of(2026, 4, 23, 10, 0, 0),
                                LocalDateTime.of(2026, 4, 21, 9, 0, 0)
                        ),
                        task(
                                202L,
                                11L,
                                "已完成任务",
                                "done",
                                "medium",
                                7L,
                                LocalDateTime.of(2026, 4, 24, 10, 0, 0),
                                LocalDateTime.of(2026, 4, 21, 9, 0, 0)
                        )
                ));
        when(projectTaskDynamicMapper.selectList(any())).thenReturn(List.of(
                dynamic(
                        201L,
                        7L,
                        "未完成任务补充了排查进展",
                        LocalDateTime.of(2026, 4, 24, 9, 30, 0)
                ),
                dynamic(
                        202L,
                        7L,
                        "已完成任务补充验收记录",
                        LocalDateTime.of(2026, 4, 24, 16, 30, 0)
                )
        ));
        when(authUserApi.getUserMapByIds(any(Set.class))).thenReturn(Map.of(
                7L,
                AuthUserSimpleDto.builder()
                        .id(7L)
                        .nickname("张三")
                        .build()
        ));

        ProjectTaskWorkReportCommand command = new ProjectTaskWorkReportCommand();
        command.setReportType("weekly");
        command.setReferenceDate(LocalDate.of(2026, 4, 24));

        ProjectTaskWorkReportDto result = service.generateCurrentUserReport(command);

        assertEquals(2, result.getTasks().size());
        assertEquals(1, result.getDynamics().size());
        assertEquals("未完成任务补充了排查进展",
                result.getDynamics().get(0).getContent());
        assertTrue(result.getTasks().stream().anyMatch(item -> item.getId().equals(202L)));
    }

    /**
     * 构造项目数据。
     *
     * @param id 项目 ID
     * @param tenantId 租户 ID
     * @param name 项目名称
     * @return 项目实体
     */
    private Project project(Long id, Long tenantId, String name) {
        Project project = new Project();
        project.setId(id);
        project.setTenantId(tenantId);
        project.setName(name);
        project.setDeleted(0);
        return project;
    }

    /**
     * 构造成员数据。
     *
     * @param taskId 任务 ID
     * @param userId 用户 ID
     * @return 成员实体
     */
    private ProjectTaskMember member(Long taskId, Long userId) {
        ProjectTaskMember member = new ProjectTaskMember();
        member.setTaskId(taskId);
        member.setUserId(userId);
        return member;
    }

    /**
     * 构造任务数据。
     *
     * @param id 任务 ID
     * @param projectId 项目 ID
     * @param title 标题
     * @param status 状态
     * @param priority 优先级
     * @param assigneeId 负责人
     * @param updateTime 更新时间
     * @param createTime 创建时间
     * @return 任务实体
     */
    private ProjectTask task(
            Long id,
            Long projectId,
            String title,
            String status,
            String priority,
            Long assigneeId,
            LocalDateTime updateTime,
            LocalDateTime createTime) {
        ProjectTask task = new ProjectTask();
        task.setId(id);
        task.setProjectId(projectId);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(priority);
        task.setAssigneeId(assigneeId);
        task.setUpdateTime(updateTime);
        task.setCreateTime(createTime);
        return task;
    }

    /**
     * 构造动态数据。
     *
     * @param taskId 任务 ID
     * @param operatorId 发布人 ID
     * @param content 动态内容
     * @param createTime 发布时间
     * @return 动态实体
     */
    private ProjectTaskDynamic dynamic(
            Long taskId,
            Long operatorId,
            String content,
            LocalDateTime createTime) {
        ProjectTaskDynamic dynamic = new ProjectTaskDynamic();
        dynamic.setTaskId(taskId);
        dynamic.setOperatorId(operatorId);
        dynamic.setContent(content);
        dynamic.setCreateTime(createTime);
        return dynamic;
    }
}
