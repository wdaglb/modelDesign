package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.TaskStatusSaveRequest;
import io.github.modelDesign.project.response.TaskStatusConfigVo;
import io.github.modelDesign.project.service.TaskStatusConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 任务状态配置接口。
 */
@Tag(name = "任务状态配置")
@RestController
@RequestMapping("/project/task-status")
@RequiredArgsConstructor
@Validated
public class TaskStatusConfigController {
    /**
     * 任务状态配置服务。
     */
    private final TaskStatusConfigService taskStatusConfigService;

    /**
     * 获取任务状态配置列表。
     *
     * @return 状态配置列表
     */
    @Operation(summary = "获取任务状态配置列表")
    @GetMapping("/list")
    public List<TaskStatusConfigVo> list() {
        return taskStatusConfigService.getList();
    }

    /**
     * 保存任务状态配置。
     *
     * @param request 保存请求
     * @return 保存后的状态配置列表
     */
    @Operation(summary = "保存任务状态配置")
    @PostMapping("/save")
    public List<TaskStatusConfigVo> save(@Valid @RequestBody TaskStatusSaveRequest request) {
        return taskStatusConfigService.save(request);
    }
}
