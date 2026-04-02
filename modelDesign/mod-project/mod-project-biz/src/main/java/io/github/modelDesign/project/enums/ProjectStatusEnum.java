package io.github.modelDesign.project.enums;

import lombok.Getter;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * 项目状态枚举。
 */
@Getter
public enum ProjectStatusEnum {
    /**
     * 规划中。
     */
    PLANNING("planning", "规划中"),
    /**
     * 进行中。
     */
    IN_PROGRESS("inProgress", "进行中"),
    /**
     * 风险中。
     */
    AT_RISK("atRisk", "风险中"),
    /**
     * 已归档。
     */
    ARCHIVED("archived", "已归档");

    /**
     * 实际存储值。
     */
    private final String value;

    /**
     * 展示文案。
     */
    private final String label;

    ProjectStatusEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    /**
     * 根据状态值解析枚举。
     *
     * @param value 状态值
     * @return 状态枚举；解析失败时返回 null
     */
    public static ProjectStatusEnum fromValue(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalizedValue = value.trim();
        return Arrays.stream(values())
                .filter(item -> item.value.equals(normalizedValue))
                .findFirst()
                .orElse(null);
    }
}
