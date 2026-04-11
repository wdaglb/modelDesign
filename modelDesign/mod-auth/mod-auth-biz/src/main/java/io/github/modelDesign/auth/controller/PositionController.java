package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.annotation.RequirePermission;
import io.github.modelDesign.auth.constant.PermissionResource;
import io.github.modelDesign.auth.request.PositionAddRequest;
import io.github.modelDesign.auth.request.PositionBatchUpdateStatusRequest;
import io.github.modelDesign.auth.request.PositionDeleteRequest;
import io.github.modelDesign.auth.request.PositionListRequest;
import io.github.modelDesign.auth.request.PositionUpdateRequest;
import io.github.modelDesign.auth.request.PositionUpdateStatusRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.PositionListItemVo;
import io.github.modelDesign.auth.service.PositionService;
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

/**
 * 职位管理接口。
 */
@Tag(name = "职位管理")
@RestController
@RequestMapping("/position")
@RequiredArgsConstructor
@Validated
public class PositionController {
    /**
     * 职位服务。
     */
    private final PositionService positionService;

    /**
     * 获取职位列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取职位列表")
    @RequirePermission(anyOf = {
            PermissionResource.SYSTEM_POSITION,
            PermissionResource.SYSTEM_USER_BIND_POSITION
    })
    @GetMapping("/list")
    public PageResponse<PositionListItemVo> list(@Valid PositionListRequest request) {
        return positionService.getList(request);
    }

    /**
     * 新增职位。
     *
     * @param request 新增请求
     * @return 职位信息
     */
    @Operation(summary = "新增职位")
    @RequirePermission(PermissionResource.SYSTEM_POSITION_CREATE)
    @PostMapping("/add")
    public PositionListItemVo add(@Valid @RequestBody PositionAddRequest request) {
        return positionService.add(request);
    }

    /**
     * 编辑职位。
     *
     * @param id 职位 ID
     * @param request 编辑请求
     * @return 职位信息
     */
    @Operation(summary = "编辑职位")
    @RequirePermission(PermissionResource.SYSTEM_POSITION_EDIT)
    @PostMapping("/update")
    public PositionListItemVo update(
            @Parameter(description = "职位 ID", required = true)
            @RequestParam
            @NotNull(message = "职位 ID 不能为空")
            Long id,
            @Valid @RequestBody PositionUpdateRequest request) {
        return positionService.update(id, request);
    }

    /**
     * 修改单个职位状态。
     *
     * @param request 状态请求
     */
    @Operation(summary = "修改单个职位状态")
    @RequirePermission(PermissionResource.SYSTEM_POSITION_CHANGE_STATUS)
    @PostMapping("/update_status")
    public void updateStatus(@Valid @RequestBody PositionUpdateStatusRequest request) {
        positionService.updateStatus(request);
    }

    /**
     * 批量修改职位状态。
     *
     * @param request 批量状态请求
     */
    @Operation(summary = "批量修改职位状态")
    @RequirePermission(PermissionResource.SYSTEM_POSITION_BATCH_CHANGE_STATUS)
    @PostMapping("/batch_update_status")
    public void batchUpdateStatus(@Valid @RequestBody PositionBatchUpdateStatusRequest request) {
        positionService.batchUpdateStatus(request);
    }

    /**
     * 删除职位。
     *
     * @param request 删除请求
     */
    @Operation(summary = "删除职位")
    @RequirePermission(PermissionResource.SYSTEM_POSITION_DELETE)
    @PostMapping("/delete")
    public void delete(@Valid @RequestBody PositionDeleteRequest request) {
        positionService.delete(request);
    }
}
