package io.github.modelDesign.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * 模型
 */
@Service
@Slf4j
@Lazy
@RequiredArgsConstructor
public class AiModelService {
    private final RestClient restClient;

    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    /**
     * 获取模型实例
     * @param modelId 模型id
     * @return 模型实例
     */
    public OpenAiChatModel get(String modelId) {
        return OpenAiChatModel.builder()
                .retryTemplate(RetryTemplate.defaultInstance())
                .openAiApi(OpenAiApi.builder()
                        .baseUrl(baseUrl)
                        .apiKey(apiKey)
                        .restClientBuilder(this.restClient.mutate())
                        .build())
                .defaultOptions(OpenAiChatOptions.builder()
//                        .model("M2-her")
                        .model(modelId)
                        .temperature(0.7)
                        .maxTokens(2048)
                        .build())
//                .toolCallingManager(ToolCallingManager.builder()
//                        .toolCallbackResolver((request, response) -> {
//                            log.info("Tool Call Request: {}", request);
//
//                        })
//                        .build())
                .build();
    }
}
