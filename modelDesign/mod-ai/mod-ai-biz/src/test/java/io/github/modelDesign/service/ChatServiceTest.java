package io.github.modelDesign.service;

import io.github.modelDesign.project.api.ProjectTaskApi;
import io.github.modelDesign.project.api.dto.MyTodoTaskDto;
import io.github.modelDesign.project.api.dto.PageResult;
import io.github.modelDesign.project.api.dto.ProjectTaskCompleteCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskCreateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskDto;
import io.github.modelDesign.project.api.dto.ProjectTaskMyTodoRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskQueryRequest;
import io.github.modelDesign.project.api.dto.ProjectTaskTypeDto;
import io.github.modelDesign.project.api.dto.ProjectTaskStatusUpdateCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportCommand;
import io.github.modelDesign.project.api.dto.ProjectTaskWorkReportDto;
import io.github.modelDesign.tools.ProjectTaskTools;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * AI 对话服务测试。
 */
class ChatServiceTest {
    /**
     * MCP 工具未启用时，不应向模型注册任何工具。
     */
    @Test
    void resolveRegisteredToolsShouldReturnEmptyWhenToolBeanMissing() {
        ChatService service = new ChatService(
                null,
                new EmptyProjectTaskToolsProvider()
        );

        Object[] result = service.resolveRegisteredTools();

        assertEquals(0, result.length);
    }

    /**
     * MCP 工具已启用时，应注册对应工具 Bean。
     */
    @Test
    void resolveRegisteredToolsShouldReturnToolWhenBeanAvailable() {
        ProjectTaskTools tools = new ProjectTaskTools(new NoopProjectTaskApi());
        ChatService service = new ChatService(
                null,
                new FixedProjectTaskToolsProvider(tools)
        );

        Object[] result = service.resolveRegisteredTools();

        assertEquals(1, result.length);
        assertEquals(tools, result[0]);
    }

    /**
     * 空工具提供器。
     */
    private static class EmptyProjectTaskToolsProvider
            implements ObjectProvider<ProjectTaskTools> {
        @Override
        public ProjectTaskTools getObject(Object... args) {
            return null;
        }

        @Override
        public ProjectTaskTools getIfAvailable() {
            return null;
        }

        @Override
        public ProjectTaskTools getIfUnique() {
            return null;
        }

        @Override
        public ProjectTaskTools getObject() {
            return null;
        }
    }

    /**
     * 固定返回工具 Bean 的提供器。
     */
    private static class FixedProjectTaskToolsProvider
            implements ObjectProvider<ProjectTaskTools> {
        private final ProjectTaskTools tools;

        private FixedProjectTaskToolsProvider(ProjectTaskTools tools) {
            this.tools = tools;
        }

        @Override
        public ProjectTaskTools getObject(Object... args) {
            return tools;
        }

        @Override
        public ProjectTaskTools getIfAvailable() {
            return tools;
        }

        @Override
        public ProjectTaskTools getIfUnique() {
            return tools;
        }

        @Override
        public ProjectTaskTools getObject() {
            return tools;
        }
    }

    /**
     * 用于构造工具实例的空 API。
     */
    private static class NoopProjectTaskApi implements ProjectTaskApi {
        @Override
        public PageResult<ProjectTaskDto> queryTasks(ProjectTaskQueryRequest request) {
            return new PageResult<>(Collections.emptyList(), 0L);
        }

        @Override
        public List<ProjectTaskTypeDto> queryTaskTypes(String name) {
            return Collections.emptyList();
        }

        @Override
        public ProjectTaskDto getTaskDetailByCode(String code) {
            return ProjectTaskDto.builder().id(1L).build();
        }

        @Override
        public ProjectTaskDto getTaskDetail(Long taskId) {
            return ProjectTaskDto.builder().id(taskId).build();
        }

        @Override
        public ProjectTaskDto createTask(ProjectTaskCreateCommand command) {
            return ProjectTaskDto.builder().id(1L).build();
        }

        @Override
        public ProjectTaskDto completeTask(ProjectTaskCompleteCommand command) {
            return ProjectTaskDto.builder().id(command.getTaskId()).build();
        }

        @Override
        public ProjectTaskDto updateTaskStatus(ProjectTaskStatusUpdateCommand command) {
            return ProjectTaskDto.builder().id(command.getTaskId()).build();
        }

        @Override
        public PageResult<MyTodoTaskDto> queryMyTodo(ProjectTaskMyTodoRequest request) {
            return new PageResult<>(Collections.emptyList(), 0L);
        }

        @Override
        public ProjectTaskWorkReportDto generateWorkReport(
                ProjectTaskWorkReportCommand command) {
            return ProjectTaskWorkReportDto.builder()
                    .reportType(command.getReportType())
                    .reportTitle("空汇报")
                    .tasks(Collections.emptyList())
                    .dynamics(Collections.emptyList())
                    .build();
        }
    }
}
