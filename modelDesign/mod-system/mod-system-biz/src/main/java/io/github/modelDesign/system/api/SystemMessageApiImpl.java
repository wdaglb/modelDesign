package io.github.modelDesign.system.api;

import io.github.modelDesign.system.api.dto.SystemMessagePublishCommand;
import io.github.modelDesign.system.service.systemMessage.SystemMessagePublishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 系统消息发布接口实现。
 */
@Service
@RequiredArgsConstructor
public class SystemMessageApiImpl implements SystemMessageApi {
    /**
     * 系统消息发布服务。
     */
    private final SystemMessagePublishService systemMessagePublishService;

    /**
     * 发布系统消息。
     *
     * @param command 发布命令
     */
    @Override
    public void publish(SystemMessagePublishCommand command) {
        systemMessagePublishService.publish(command);
    }
}
