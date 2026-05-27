package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.TaskIterationCreateRequest;
import io.github.modelDesign.project.request.TaskIterationDeleteRequest;
import io.github.modelDesign.project.request.TaskIterationEditRequest;
import io.github.modelDesign.project.request.TaskIterationListRequest;
import io.github.modelDesign.project.response.TaskIterationVo;
import io.github.modelDesign.project.service.TaskIterationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 任务迭代接口。
 */
@Tag(name = "任务迭代")
@RestController
@RequestMapping("/project/task-iteration")
@RequiredArgsConstructor
@Validated
public class TaskIterationController {
    /**
     * 任务迭代服务。
     */
    private final TaskIterationService taskIterationService;

    /**
     * 获取任务迭代列表。
     *
     * @param request 列表请求
     * @return 迭代列表
     */
    @Operation(summary = "获取任务迭代列表")
    @GetMapping("/list")
    public List<TaskIterationVo> list(@Valid TaskIterationListRequest request) {
        return taskIterationService.getList(request);
    }

    /**
     * 创建任务迭代。
     *
     * @param request 创建请求
     * @return 创建后的迭代
     */
    @Operation(summary = "创建任务迭代")
    @PostMapping("/create")
    public TaskIterationVo create(@Valid @RequestBody TaskIterationCreateRequest request) {
        return taskIterationService.create(request);
    }

    /**
     * 编辑任务迭代。
     *
     * @param id      迭代 ID
     * @param request 编辑请求
     * @return 编辑后的迭代
     */
    @Operation(summary = "编辑任务迭代")
    @PostMapping("/edit")
    public TaskIterationVo edit(
            @Parameter(description = "迭代 ID", required = true)
            @RequestParam
            @NotNull(message = "迭代 ID 不能为空")
            Long id,
            @Valid @RequestBody TaskIterationEditRequest request) {
        return taskIterationService.edit(id, request);
    }

    /**
     * 删除任务迭代。
     *
     * @param request 删除请求
     * @return 删除数量
     */
    @Operation(summary = "删除任务迭代")
    @PostMapping("/deleted")
    public Integer deleted(@Valid @RequestBody TaskIterationDeleteRequest request) {
        taskIterationService.deleted(request.getId());
        return 1;
    }
}
