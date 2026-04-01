package io.github.modelDesign.system.enums;

/**
 * 系统消息推送任务状态。
 */
public enum SystemMessagePushTaskStatusEnum {
    /**
     * 待推送。
     */
    PENDING,

    /**
     * 推送中。
     */
    PROCESSING,

    /**
     * 推送成功。
     */
    SUCCESS,

    /**
     * 推送失败。
     */
    FAILED
}
