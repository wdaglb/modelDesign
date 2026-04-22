package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 工作报表生成请求。
 */
@Data
@Schema(description = "工作报表生成请求")
public class ProjectTaskWorkReportGenerateRequest {
    /**
     * 报表类型。
     */
    @Schema(
            description = "报表类型",
            allowableValues = {"daily", "weekly", "monthly", "yearly"},
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "报表类型不能为空")
    @Pattern(
            regexp = "daily|weekly|monthly|yearly",
            message = "报表类型不支持"
    )
    private String reportType;

    /**
     * 参考日期。
     */
    @Schema(
            description = "参考日期；日报按当天，周报/月报/年报按该日期所在周期推导区间"
    )
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate referenceDate;
}
