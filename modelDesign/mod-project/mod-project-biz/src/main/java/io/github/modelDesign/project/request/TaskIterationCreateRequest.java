package io.github.modelDesign.project.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 创建任务迭代请求。
 */
@Data
@Schema(description = "创建任务迭代请求")
public class TaskIterationCreateRequest {
    /**
     * 迭代名称。
     */
    @Schema(description = "迭代名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "迭代名称不能为空")
    @Size(max = 64, message = "迭代名称长度不能超过 64 个字符")
    private String name;

    /**
     * 开始日期。
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "开始日期", example = "2026-05-01",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    /**
     * 结束日期。
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "结束日期", example = "2026-05-15",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "结束日期不能为空")
    private LocalDate endDate;

    /**
     * 是否已发布。
     */
    @Schema(description = "是否已发布")
    private Boolean published;
}
