package com.sdecloud.springai.alibaba.service.impl;

import com.alibaba.cloud.ai.graph.RunnableConfig;
import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.sdecloud.springai.alibaba.common.enums.ModelType;
import com.sdecloud.springai.alibaba.service.AgentService;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent 服务实现类
 * 支持多种模型的 Agent 调用
 */
@Service
public class AgentServiceImpl implements AgentService {

    @Autowired(required = false)
    @Qualifier("qwenWeatherAgent")
    private ReactAgent qwenWeatherAgent; // 可选，如果未配置 DashScope API Key 则为 null

    @Autowired(required = false)
    @Qualifier("deepSeekWeatherAgent")
    private ReactAgent deepSeekWeatherAgent; // 可选，如果未配置 DeepSeek API Key 则为 null

    // Agent 缓存映射
    private final Map<String, ReactAgent> agentMap = new ConcurrentHashMap<>();
    private boolean initialized = false;

    /**
     * 延迟初始化 Agent 映射
     * 注意：不在 @PostConstruct 中初始化，因为此时依赖的 Agent Bean 可能还未创建
     * 改为在第一次使用时延迟初始化，确保所有 Bean 都已创建完成
     */
    private synchronized void initAgentMap() {
        if (!initialized) {
            // 只有当 qwenWeatherAgent 存在时才添加到映射中
            if (qwenWeatherAgent != null) {
                agentMap.put(ModelType.QWEN.getCode(), qwenWeatherAgent);
            }
            // 只有当 deepSeekWeatherAgent 存在时才添加到映射中
            if (deepSeekWeatherAgent != null) {
                agentMap.put(ModelType.DEEPSEEK.getCode(), deepSeekWeatherAgent);
            }
            
            initialized = true;
        }
    }

    /**
     * 根据模型类型获取对应的 Agent
     */
    private ReactAgent getAgent(String modelType) {
        // 确保已经初始化
        if (!initialized) {
            initAgentMap();
        }
        
        // 如果没有任何 Agent 可用，直接抛出异常
        if (agentMap.isEmpty() && deepSeekWeatherAgent == null && qwenWeatherAgent == null) {
            throw new IllegalStateException("没有可用的 Agent，请至少配置一个 API Key（DeepSeek 或 DashScope）");
        }
        
        ModelType type = ModelType.fromCode(modelType);
        ReactAgent agent = agentMap.get(type.getCode());
        
        // 如果请求的模型不存在，优先返回 DeepSeek Agent，否则返回 Qwen Agent
        if (agent == null) {
            if (deepSeekWeatherAgent != null) {
                return deepSeekWeatherAgent;
            }
            if (qwenWeatherAgent != null) {
                return qwenWeatherAgent;
            }
            throw new IllegalStateException("没有可用的 Agent，请至少配置一个 API Key（DeepSeek 或 DashScope）");
        }
        
        return agent;
    }

    /**
     * 调用 Agent 进行对话
     *
     * @param message 用户消息
     * @param threadId 对话线程ID，如果为null则创建新的对话
     * @param userId 用户ID
     * @param modelType 模型类型（qwen/deepseek）
     * @return Agent 响应
     */
    @Override
    public String chat(String message, String threadId, String userId, String modelType) {
        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            ReactAgent agent = getAgent(modelType);

            RunnableConfig runnableConfig = RunnableConfig.builder()
                    .threadId(threadId)
                    .addMetadata("user_id", userId != null ? userId : "1")
                    .build();

            AssistantMessage response = agent.call(message, runnableConfig);
            return response.getText();
        } catch (Exception e) {
            throw new RuntimeException("调用 Agent 失败: " + e.getMessage(), e);
        }
    }

    /**
     * 调用 Agent 进行对话（使用默认用户ID和默认模型）
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @return Agent 响应
     */
    @Override
    public String chat(String message, String threadId) {
        return chat(message, threadId, "1", ModelType.DEEPSEEK.getCode());
    }

    /**
     * 流式调用 Agent 进行对话（SSE）
     *
     * @param message 用户消息
     * @param threadId 对话线程ID，如果为null则创建新的对话
     * @param userId 用户ID
     * @param modelType 模型类型（qwen/deepseek）
     * @param response HTTP 响应对象
     * @return SSE Emitter
     */
    @Override
    public SseEmitter chatStream(String message, String threadId, String userId, String modelType, HttpServletResponse response) {
        // 设置 SSE 响应头
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        // 创建 SseEmitter，不设置超时
        SseEmitter emitter = new SseEmitter(0L);

        // 异步处理流式请求
        CompletableFuture.runAsync(() -> {
            try {
                String finalThreadId = threadId;
                if (finalThreadId == null || finalThreadId.isEmpty()) {
                    finalThreadId = UUID.randomUUID().toString();
                }

                final String threadIdToUse = finalThreadId;
                
                ReactAgent agent = getAgent(modelType);
                
                RunnableConfig runnableConfig = RunnableConfig.builder()
                        .threadId(threadIdToUse)
                        .addMetadata("user_id", userId != null ? userId : "1")
                        .build();

                // 发送 threadId
                emitter.send(SseEmitter.event()
                        .name("threadId")
                        .data(threadIdToUse));

                // 调用 Agent 获取完整响应
                AssistantMessage assistantMessage = agent.call(message, runnableConfig);
                String fullResponse = assistantMessage.getText();

                // 模拟流式输出：将完整响应分块发送
                if (fullResponse != null && !fullResponse.isEmpty()) {
                    // 按字符或小段发送，模拟流式效果
                    int chunkSize = 3; // 每次发送3个字符
                    for (int i = 0; i < fullResponse.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, fullResponse.length());
                        String chunk = fullResponse.substring(i, end);
                        
                        emitter.send(SseEmitter.event()
                                .name("message")
                                .data(chunk));
                        
                        // 添加小延迟，模拟真实流式输出
                        Thread.sleep(50);
                    }
                }

                // 发送完成信号
                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(""));

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("调用 Agent 失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        // 设置错误和完成回调
        emitter.onError((ex) -> {
            // 错误处理
        });

        emitter.onTimeout(() -> {
            emitter.complete();
        });

        return emitter;
    }
}

