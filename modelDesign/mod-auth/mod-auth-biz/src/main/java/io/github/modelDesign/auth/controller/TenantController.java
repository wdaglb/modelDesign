package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.annotation.IgnorePermission;
import io.github.modelDesign.auth.request.TenantAddRequest;
import io.github.modelDesign.auth.request.TenantDeleteRequest;
import io.github.modelDesign.auth.request.TenantListRequest;
import io.github.modelDesign.auth.request.TenantUpdateRequest;
import io.github.modelDesign.auth.request.TenantUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.TenantListItemVo;
import io.github.modelDesign.auth.response.TenantOptionVo;
import io.github.modelDesign.auth.service.TenantService;
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
 * 租户管理接口。
 */
@Tag(name = "租户管理")
@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@Validated
public class TenantController {
    /**
     * 租户服务。
     */
    private final TenantService tenantService;

    /**
     * 获取租户列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取租户列表")
    @GetMapping("/list")
    public PageResponse<TenantListItemVo> list(@Valid TenantListRequest request) {
        return tenantService.getList(request);
    }

    /**
     * 新增租户。
     *
     * @param request 新增请求
     * @return 租户信息
     */
    @Operation(summary = "新增租户")
    @PostMapping("/add")
    public TenantListItemVo add(@Valid @RequestBody TenantAddRequest request) {
        return tenantService.add(request);
    }

    /**
     * 编辑租户。
     *
     * @param id 租户 ID
     * @param request 编辑请求
     * @return 租户信息
     */
    @Operation(summary = "编辑租户")
    @PostMapping("/update")
    public TenantListItemVo update(
            @Parameter(description = "租户 ID", required = true)
            @RequestParam
            @NotNull(message = "租户 ID 不能为空")
            Long id,
            @Valid @RequestBody TenantUpdateRequest request) {
        return tenantService.update(id, request);
    }

    /**
     * 修改单个租户状态。
     *
     * @param request 状态请求
     */
    @Operation(summary = "修改单个租户状态")
    @PostMapping("/update_status")
    public void updateStatus(@Valid @RequestBody TenantUpdateStatusRequest request) {
        tenantService.updateStatus(request);
    }

    /**
     * 删除租户。
     *
     * @param request 删除请求
     */
    @Operation(summary = "删除租户")
    @PostMapping("/delete")
    public void delete(@Valid @RequestBody TenantDeleteRequest request) {
        tenantService.delete(request);
    }

    /**
     * 获取可选租户下拉项。
     *
     * @return 租户下拉项
     */
    @Operation(summary = "获取可选租户下拉项")
    @IgnorePermission
    @GetMapping("/options")
    public List<TenantOptionVo> options() {
        return tenantService.getOptions();
    }
}
