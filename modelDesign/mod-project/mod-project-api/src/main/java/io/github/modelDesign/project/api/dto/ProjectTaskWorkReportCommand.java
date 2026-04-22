package io.github.modelDesign.project.api.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 当前登录用户工作汇报查询命令。
 */
@Data
public class ProjectTaskWorkReportCommand {
    /**
     * 汇报类型。
     *
     * 支持 daily、weekly、monthly、yearly 四种周期，
     * 统一由下游服务做周期边界换算，避免工具层重复维护时间口径。
     */
    private String reportType;

    /**
     * 参考日期。
     *
     * 日报直接使用当天，
     * 周报、月报、年报则按该日期所在的自然周、自然月、自然年推导统计区间。
     */
    private LocalDate referenceDate;
}
