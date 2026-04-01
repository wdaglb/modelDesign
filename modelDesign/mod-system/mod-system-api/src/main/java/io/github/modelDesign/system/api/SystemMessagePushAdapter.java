package io.github.modelDesign.system.api;

import io.github.modelDesign.system.api.dto.SystemMessagePushContext;

/**
 * 系统消息第三方推送适配器。
 */
public interface SystemMessagePushAdapter {
    /**
     * 获取适配器编码。
     *
     * @return 适配器编码
     */
    String getAdapterCode();

    /**
     * 推送系统消息。
     *
     * @param context 推送上下文
     */
    void push(SystemMessagePushContext context);
}
