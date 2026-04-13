package io.github.modelDesign.project.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.project.request.ProjectTaskMemberUpdateRequest;
import io.github.modelDesign.project.response.ProjectTaskMemberVo;
import io.github.modelDesign.project.service.ProjectTaskMemberService;
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
 * 项目任务成员接口。
 */
@Tag(name = "项目任务成员")
@RestController
@RequestMapping("/project/task/member")
@RequiredArgsConstructor
@Validated
public class ProjectTaskMemberController {
    /**
     * 项目任务成员服务。
     */
    private final ProjectTaskMemberService projectTaskMemberService;

    /**
     * 获取任务成员列表。
     *
     * @param taskId 任务 ID
     * @return 任务成员列表
     */
    @Operation(summary = "获取任务成员列表")
    @RequirePermission(anyOf = {
            PermissionResource.PROJECT_TASK,
            PermissionResource.PROJECT_TASK_MEMBER_MANAGE
    })
    @GetMapping("/list")
    public List<ProjectTaskMemberVo> list(@Parameter(description = "任务 ID", required = true) @RequestParam @NotNull(message = "任务 ID 不能为空") Long taskId) {
        return projectTaskMemberService.getList(taskId);
    }

    /**
     * 添加任务成员。
     *
     * @param request 成员变更请求
     * @return 新增数量
     */
    @Operation(summary = "添加任务成员")
    @PostMapping("/add")
    public Integer add(@Valid @RequestBody ProjectTaskMemberUpdateRequest request) {
        return projectTaskMemberService.add(request);
    }

    /**
     * 删除任务成员。
     *
     * @param request 成员变更请求
     * @return 删除数量
     */
    @Operation(summary = "删除任务成员")
    @PostMapping("/delete")
    public Integer delete(@Valid @RequestBody ProjectTaskMemberUpdateRequest request) {
        return projectTaskMemberService.delete(request);
    }
}
