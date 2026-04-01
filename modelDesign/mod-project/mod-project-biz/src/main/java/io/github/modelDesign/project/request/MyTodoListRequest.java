package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 我的待办列表请求。
 */
@Data
@Schema(description = "我的待办列表请求")
public class MyTodoListRequest {
    /**
     * 当前页码。
     */
    @Schema(description = "当前页码")
    @Min(value = 1, message = "当前页码必须大于 0")
    private Integer current = 1;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数必须大于 0")
    private Integer pageSize = 10;

    /**
     * 任务标题关键字。
     */
    @Schema(description = "任务标题关键字")
    @Size(max = 128, message = "标题长度不能超过 128 个字符")
    private String title;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    @Size(max = 32, message = "优先级长度不能超过 32 个字符")
    private String priority;

    /**
     * 任务状态编码。
     */
    @Schema(description = "任务状态编码", allowableValues = {"todo", "inProgress", "pendingTest", "pendingRelease", "done", "canceled"})
    @Size(max = 32, message = "状态长度不能超过 32 个字符")
    private String status;
}
