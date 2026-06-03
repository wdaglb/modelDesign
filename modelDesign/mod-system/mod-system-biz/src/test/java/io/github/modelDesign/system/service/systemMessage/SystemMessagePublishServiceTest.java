package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.auth.api.AuthUserApi;
import io.github.modelDesign.system.api.SystemMessagePushAdapter;
import io.github.modelDesign.system.domain.SystemMessage;
import io.github.modelDesign.system.domain.SystemMessagePushTask;
import io.github.modelDesign.system.enums.SystemMessagePushTaskStatusEnum;
import io.github.modelDesign.system.queue.systemMessage.SystemMessagePushProducer;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

/**
 * 系统消息发布服务测试。
 */
class SystemMessagePublishServiceTest {
    /**
     * 默认 provider 应包含企业微信，保证现有系统消息无需逐个调用方补配置。
     */
    @Test
    void resolvePublishAdapterCodesShouldAddQyworkByDefault() {
        SystemMessagePushAdapterRegistry registry = new SystemMessagePushAdapterRegistry(List.of(qyworkAdapter()));

        List<String> adapterCodes = registry.resolvePublishAdapterCodes(null);

        assertEquals(List.of("qywork"), adapterCodes);
    }

    /**
     * 调用方显式传入企业微信时应去重，避免同一消息生成重复渠道任务。
     */
    @Test
    void resolvePublishAdapterCodesShouldDeduplicateExplicitQywork() {
        SystemMessagePushAdapterRegistry registry = new SystemMessagePushAdapterRegistry(List.of(qyworkAdapter()));

        List<String> adapterCodes = registry.resolvePublishAdapterCodes(List.of("qywork", "qywork"));

        assertEquals(List.of("qywork"), adapterCodes);
    }

    /**
     * 每个 provider 独立生成推送任务，后续单渠道失败只会影响自己的任务状态。
     */
    @Test
    void buildPushTasksShouldCreateIndependentTaskForEachProvider() {
        SystemMessagePublishService service = new SystemMessagePublishService(
                mock(SystemMessageService.class),
                mock(AuthUserApi.class),
                mock(SystemMessagePushTaskService.class),
                mock(SystemMessagePushAdapterRegistry.class),
                mock(SystemMessagePushProducer.class)
        );
        SystemMessage message = new SystemMessage();
        message.setId(10L);
        message.setTenantId(1L);
        message.setReceiverUserId(2L);

        List<SystemMessagePushTask> tasks = service.buildPushTasks(messageList(message), List.of("qywork", "email"));

        assertEquals(2, tasks.size());
        assertEquals("qywork", tasks.get(0).getAdapterCode());
        assertEquals("email", tasks.get(1).getAdapterCode());
        assertEquals(SystemMessagePushTaskStatusEnum.PENDING.name(), tasks.get(0).getStatus());
        assertEquals(SystemMessagePushTaskStatusEnum.PENDING.name(), tasks.get(1).getStatus());
    }

    private List<SystemMessage> messageList(SystemMessage message) {
        return List.of(message);
    }

    private SystemMessagePushAdapter qyworkAdapter() {
        return new SystemMessagePushAdapter() {
            @Override
            public String getAdapterCode() {
                return "qywork";
            }

            @Override
            public void push(io.github.modelDesign.system.api.dto.SystemMessagePushContext context) {
                /**
                 * 测试只关心 provider 注册和编码合并，不需要真实推送。
                 */
            }
        };
    }
}
