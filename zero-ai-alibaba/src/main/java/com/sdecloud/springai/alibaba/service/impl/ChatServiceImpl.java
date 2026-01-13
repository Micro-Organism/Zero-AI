package com.sdecloud.springai.alibaba.service.impl;

import com.sdecloud.springai.alibaba.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.deepseek.DeepSeekChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * Chat 服务实现类（基于 ChatClient）
 * 提供简单的流式对话功能，不使用智能体
 */
@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ChatClient chatClient;

    @Value("${spring.ai.chat.default-model:deepseek-chat}")
    private String defaultModel;

    @Autowired
    public ChatServiceImpl(
            @Qualifier("deepSeekChatModel") ChatModel deepSeekChatModel,
            SimpleLoggerAdvisor simpleLoggerAdvisor,
            MessageChatMemoryAdvisor messageChatMemoryAdvisor
    ) {
        // 构建 ChatClient，使用简单的配置
        this.chatClient = ChatClient.builder(deepSeekChatModel)
                .defaultAdvisors(
                        simpleLoggerAdvisor,
                        messageChatMemoryAdvisor
                )
                .build();
    }

    @Override
    public Flux<String> chat(String prompt, String chatId, String model) {
        log.debug("Chat request - prompt: {}, chatId: {}, model: {}", prompt, chatId, model);

        // 如果没有指定模型，使用默认模型
        String modelToUse = (model != null && !model.isEmpty()) ? model : defaultModel;

        // 构建 ChatOptions（DeepSeek 使用 DeepSeekChatOptions）
        DeepSeekChatOptions options = DeepSeekChatOptions.builder()
                .model(modelToUse)
                .temperature(0.7)
                .build();

        // 使用 ChatClient 进行流式对话
        ChatClient.ChatClientRequestSpec clientRequestSpec = chatClient.prompt()
                .options(options)
                .user(prompt)
                .advisors(memoryAdvisor -> memoryAdvisor
                        .param(ChatMemory.CONVERSATION_ID, chatId != null ? chatId : "default-chat")
                );

        // 返回流式内容
        return clientRequestSpec.stream().content();
    }
}

