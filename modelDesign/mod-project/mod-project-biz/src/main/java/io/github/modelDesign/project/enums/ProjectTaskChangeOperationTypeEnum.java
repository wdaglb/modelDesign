package io.github.modelDesign.project.enums;

/**
 * 任务变更日志操作类型。
 */
public enum ProjectTaskChangeOperationTypeEnum {
    /**
     * 创建任务。
     */
    CREATE("create", "创建任务"),

    /**
     * 编辑任务。
     */
    UPDATE("update", "更新任务"),

    /**
     * 删除任务。
     */
    DELETE("delete", "删除任务"),

    /**
     * 添加任务成员。
     */
    MEMBER_ADD("memberAdd", "添加任务成员"),

    /**
     * 移除任务成员。
     */
    MEMBER_REMOVE("memberRemove", "移除任务成员");

    /**
     * 操作类型编码。
     */
    private final String code;

    /**
     * 操作文案。
     */
    private final String text;

    ProjectTaskChangeOperationTypeEnum(String code, String text) {
        this.code = code;
        this.text = text;
    }

    /**
     * 获取操作类型编码。
     *
     * @return 操作类型编码
     */
    public String getCode() {
        return code;
    }

    /**
     * 获取操作文案。
     *
     * @return 操作文案
     */
    public String getText() {
        return text;
    }

    /**
     * 由编码解析枚举。
     *
     * @param code 编码
     * @return 枚举值
     */
    public static ProjectTaskChangeOperationTypeEnum fromCode(String code) {
        for (ProjectTaskChangeOperationTypeEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("未知的任务变更日志操作类型：" + code);
    }
}
