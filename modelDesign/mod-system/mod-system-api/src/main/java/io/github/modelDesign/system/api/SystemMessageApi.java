package io.github.modelDesign.system.api;

import io.github.modelDesign.system.api.dto.SystemMessagePublishCommand;

/**
 * 系统消息发布接口。
 */
public interface SystemMessageApi {
    /**
     * 发布系统消息。
     *
     * @param command 发布命令
     */
    void publish(SystemMessagePublishCommand command);
}
