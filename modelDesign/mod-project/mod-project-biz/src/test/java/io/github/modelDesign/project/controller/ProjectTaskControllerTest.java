package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDynamicDto;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportTaskDto;
import io.github.modelDesign.project.request.ProjectTaskWorkReportGenerateRequest;
import io.github.modelDesign.project.response.ProjectTaskWorkReportVo;
import io.github.modelDesign.project.service.ProjectTaskBoardQueryService;
import io.github.modelDesign.project.service.ProjectTaskService;
import io.github.modelDesign.project.service.ProjectTaskWorkReportService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 项目任务控制器测试。
 */
class ProjectTaskControllerTest {
    /**
     * 报表生成接口应透传请求并返回映射后的结果。
     */
    @Test
    void generateReportShouldDelegateToWorkReportService() {
        ProjectTaskWorkReportService workReportService =
                mock(ProjectTaskWorkReportService.class);
        ProjectTaskController controller = new ProjectTaskController(
                mock(ProjectTaskService.class),
                mock(ProjectTaskBoardQueryService.class),
                workReportService
        );

        when(workReportService.generateCurrentUserReport(any())).thenReturn(
                ProjectTaskWorkReportDto.builder()
                        .reportType("daily")
                        .reportTitle("日报（2026-04-23）")
                        .periodStart("2026-04-23 00:00:00")
                        .periodEnd("2026-04-23 23:59:59")
                        .tasks(List.of(
                                ProjectTaskWorkReportTaskDto.builder()
                                        .id(101L)
                                        .title("补充报表入口")
                                        .participationRole("负责人")
                                        .status("inProgress")
                                        .priority("high")
                                        .build()
                        ))
                        .dynamics(List.of(
                                ProjectTaskWorkReportDynamicDto.builder()
                                        .taskId(101L)
                                        .taskTitle("补充报表入口")
                                        .content("已补齐 HTTP 入口")
                                        .build()
                        ))
                        .build()
        );

        ProjectTaskWorkReportGenerateRequest request =
                new ProjectTaskWorkReportGenerateRequest();
        request.setReportType("daily");
        request.setReferenceDate(LocalDate.of(2026, 4, 23));

        ProjectTaskWorkReportVo result = controller.generateReport(request);

        ArgumentCaptor<ProjectTaskWorkReportCommand> captor =
                ArgumentCaptor.forClass(ProjectTaskWorkReportCommand.class);
        verify(workReportService).generateCurrentUserReport(captor.capture());
        assertEquals("daily", captor.getValue().getReportType());
        assertEquals(
                LocalDate.of(2026, 4, 23),
                captor.getValue().getReferenceDate()
        );
        assertEquals("日报（2026-04-23）", result.getReportTitle());
        assertEquals(1, result.getTasks().size());
        assertEquals("补充报表入口", result.getTasks().get(0).getTitle());
        assertEquals(1, result.getDynamics().size());
        assertEquals("已补齐 HTTP 入口", result.getDynamics().get(0).getContent());
    }
}
