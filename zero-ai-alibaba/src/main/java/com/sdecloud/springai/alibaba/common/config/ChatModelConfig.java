package com.sdecloud.springai.alibaba.common.config;

import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.deepseek.DeepSeekChatModel;
import org.springframework.ai.deepseek.DeepSeekChatOptions;
import org.springframework.ai.deepseek.api.DeepSeekApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ChatModel 配置类
 * 支持多种模型：Qwen、DeepSeek 等
 */
@Configuration
public class ChatModelConfig {

    @Value("${spring.ai.dashscope.api-key:}")
    private String dashScopeApiKey;

    @Value("${spring.ai.deepseek.api-key:}")
    private String deepSeekApiKey;


    /**
     * Qwen ChatModel
     * 注意：如果未配置 API Key，此 Bean 将不会被创建（使用 @ConditionalOnProperty）
     */
    @Bean(name = "qwenChatModel")
    @ConditionalOnProperty(name = "spring.ai.dashscope.api-key", matchIfMissing = false)
    public ChatModel qwenChatModel() {
        // 确保 API Key 已配置且不是占位符
        if (dashScopeApiKey == null || dashScopeApiKey.isEmpty() || dashScopeApiKey.equals("your_dashscope_api_key_here")) {
            throw new IllegalStateException("DashScope API Key 未配置，请在配置文件中设置 spring.ai.dashscope.api-key");
        }

        DashScopeApi dashScopeApi = DashScopeApi.builder()
                .apiKey(dashScopeApiKey)
                .build();

        DashScopeChatOptions options = DashScopeChatOptions.builder()
                .model("qwen-plus")
                .temperature(0.7)
                .build();

        return DashScopeChatModel.builder()
                .dashScopeApi(dashScopeApi)
                .defaultOptions(options)
                .build();
    }

    /**
     * DeepSeek ChatModel
     * 注意：如果未配置 API Key，此 Bean 将不会被创建（使用 @ConditionalOnProperty）
     */
    @Bean(name = "deepSeekChatModel")
    @ConditionalOnProperty(name = "spring.ai.deepseek.api-key", matchIfMissing = false)
    public ChatModel deepSeekChatModel() {
        // 检查是否是未解析的环境变量占位符
        if (deepSeekApiKey != null && deepSeekApiKey.startsWith("${") && deepSeekApiKey.endsWith("}")) {
            throw new IllegalStateException("DeepSeek API Key 环境变量未解析，请设置环境变量 AI_DEEPSEEK_API_KEY");
        }
        
        // 确保 API Key 已配置且不是占位符
        if (deepSeekApiKey == null || deepSeekApiKey.isEmpty() || deepSeekApiKey.equals("your_deepseek_api_key_here")) {
            throw new IllegalStateException("DeepSeek API Key 未配置，请在配置文件中设置 spring.ai.deepseek.api-key 或设置环境变量 AI_DEEPSEEK_API_KEY");
        }

        // 创建 DeepSeekApi
        DeepSeekApi deepSeekApi = DeepSeekApi.builder()
                .apiKey(deepSeekApiKey)
                .build();

        DeepSeekChatOptions options = DeepSeekChatOptions.builder()
                .model("deepseek-chat")
                .temperature(0.7)
                .build();

        return DeepSeekChatModel.builder()
                .deepSeekApi(deepSeekApi)
                .defaultOptions(options)
                .build();
    }
}

