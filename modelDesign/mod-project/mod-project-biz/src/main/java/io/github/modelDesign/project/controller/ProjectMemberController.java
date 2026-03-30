package io.github.modelDesign.project.controller;

import io.github.modelDesign.project.request.ProjectMemberUpdateRequest;
import io.github.modelDesign.project.response.ProjectMemberVo;
import io.github.modelDesign.project.service.ProjectMemberService;
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
 * 项目成员接口。
 */
@RestController
@RequestMapping("/project/member")
@RequiredArgsConstructor
@Validated
public class ProjectMemberController {
    /**
     * 项目成员服务。
     */
    private final ProjectMemberService projectMemberService;

    /**
     * 获取项目成员列表。
     *
     * @param projectId 项目 ID
     * @return 项目成员列表
     */
    @GetMapping("/list")
    public List<ProjectMemberVo> list(@RequestParam @NotNull(message = "项目 ID 不能为空") Long projectId) {
        return projectMemberService.getList(projectId);
    }

    /**
     * 添加项目成员。
     *
     * @param request 成员变更请求
     * @return 新增数量
     */
    @PostMapping("/add")
    public Integer add(@Valid @RequestBody ProjectMemberUpdateRequest request) {
        return projectMemberService.add(request);
    }

    /**
     * 删除项目成员。
     *
     * @param request 成员变更请求
     * @return 删除数量
     */
    @PostMapping("/delete")
    public Integer delete(@Valid @RequestBody ProjectMemberUpdateRequest request) {
        return projectMemberService.delete(request);
    }
}
