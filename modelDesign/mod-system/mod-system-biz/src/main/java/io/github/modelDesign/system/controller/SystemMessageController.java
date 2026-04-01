package io.github.modelDesign.system.controller;

import io.github.modelDesign.system.request.SystemMessageListRequest;
import io.github.modelDesign.system.request.SystemMessageReadAllRequest;
import io.github.modelDesign.system.request.SystemMessageReadRequest;
import io.github.modelDesign.system.response.PageResponse;
import io.github.modelDesign.system.response.SystemMessageDetailVo;
import io.github.modelDesign.system.response.SystemMessageListItemVo;
import io.github.modelDesign.system.response.SystemMessageUnreadCountVo;
import io.github.modelDesign.system.service.systemMessage.SystemMessageCenterService;
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
 * 系统消息接口。
 */
@Tag(name = "系统消息")
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/system/message")
public class SystemMessageController {
    /**
     * 系统消息中心服务。
     */
    private final SystemMessageCenterService systemMessageCenterService;

    /**
     * 获取当前用户消息列表。
     *
     * @param request 列表请求
     * @return 分页结果
     */
    @Operation(summary = "获取当前用户消息列表")
    @GetMapping("/list")
    public PageResponse<SystemMessageListItemVo> list(@Valid SystemMessageListRequest request) {
        return systemMessageCenterService.getList(request);
    }

    /**
     * 获取当前用户消息详情。
     *
     * @param id 消息 ID
     * @return 消息详情
     */
    @Operation(summary = "获取当前用户消息详情")
    @GetMapping("/detail")
    public SystemMessageDetailVo detail(
            @Parameter(description = "消息 ID", required = true)
            @RequestParam
            @NotNull(message = "消息 ID 不能为空")
            Long id) {
        return systemMessageCenterService.getDetail(id);
    }

    /**
     * 获取当前用户未读数量。
     *
     * @return 未读数量
     */
    @Operation(summary = "获取当前用户未读数量")
    @GetMapping("/unread-count")
    public SystemMessageUnreadCountVo unreadCount() {
        return systemMessageCenterService.getUnreadCount();
    }

    /**
     * 标记单条消息已读。
     *
     * @param request 已读请求
     * @return 新增已读数量
     */
    @Operation(summary = "标记单条消息已读")
    @PostMapping("/read")
    public Integer read(@Valid @RequestBody SystemMessageReadRequest request) {
        return systemMessageCenterService.read(request);
    }

    /**
     * 按当前筛选条件全部标记已读。
     *
     * @param request 全部已读请求
     * @return 新增已读数量
     */
    @Operation(summary = "按当前筛选条件全部标记已读")
    @PostMapping("/read-all")
    public Integer readAll(@Valid @RequestBody SystemMessageReadAllRequest request) {
        return systemMessageCenterService.readAll(request);
    }
}
