package com.sdecloud.springai.alibaba.service.impl;

import com.alibaba.cloud.ai.graph.RunnableConfig;
import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.alibaba.cloud.ai.graph.agent.flow.agent.SequentialAgent;
import com.alibaba.cloud.ai.graph.agent.flow.agent.SupervisorAgent;
import com.sdecloud.springai.alibaba.service.MultiAgentService;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 多智能体服务实现类
 */
@Service
public class MultiAgentServiceImpl implements MultiAgentService {

    @Autowired(required = false)
    @Qualifier("supervisorAgent")
    private SupervisorAgent supervisorAgent;

    @Autowired(required = false)
    @Qualifier("sequentialAgent")
    private SequentialAgent sequentialAgent;

    @Autowired(required = false)
    @Qualifier("coordinatorAgent")
    private ReactAgent coordinatorAgent;

    @Override
    public String supervisorChat(String message, String threadId, String userId) {
        if (supervisorAgent == null) {
            throw new IllegalStateException("SupervisorAgent 未配置，请检查配置");
        }

        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            RunnableConfig runnableConfig = RunnableConfig.builder()
                    .threadId(threadId)
                    .addMetadata("user_id", userId != null ? userId : "1")
                    .build();

            Optional<com.alibaba.cloud.ai.graph.OverAllState> result = supervisorAgent.invoke(message, runnableConfig);
            if (result.isPresent()) {
                // 从状态中提取最终响应
                return extractResponseFromState(result.get());
            }
            return "未获取到响应";
        } catch (Exception e) {
            throw new RuntimeException("调用 SupervisorAgent 失败: " + e.getMessage(), e);
        }
    }

    @Override
    public String sequentialChat(String message, String threadId, String userId) {
        if (sequentialAgent == null) {
            throw new IllegalStateException("SequentialAgent 未配置，请检查配置");
        }

        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            RunnableConfig runnableConfig = RunnableConfig.builder()
                    .threadId(threadId)
                    .addMetadata("user_id", userId != null ? userId : "1")
                    .build();

            Optional<com.alibaba.cloud.ai.graph.OverAllState> result = sequentialAgent.invoke(message, runnableConfig);
            if (result.isPresent()) {
                return extractResponseFromState(result.get());
            }
            return "未获取到响应";
        } catch (Exception e) {
            throw new RuntimeException("调用 SequentialAgent 失败: " + e.getMessage(), e);
        }
    }

    @Override
    public String coordinatorChat(String message, String threadId, String userId) {
        if (coordinatorAgent == null) {
            throw new IllegalStateException("CoordinatorAgent 未配置，请检查配置");
        }

        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            RunnableConfig runnableConfig = RunnableConfig.builder()
                    .threadId(threadId)
                    .addMetadata("user_id", userId != null ? userId : "1")
                    .build();

            AssistantMessage response = coordinatorAgent.call(message, runnableConfig);
            return response.getText();
        } catch (Exception e) {
            throw new RuntimeException("调用 CoordinatorAgent 失败: " + e.getMessage(), e);
        }
    }

    @Override
    public SseEmitter supervisorChatStream(String message, String threadId, String userId, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                String finalThreadId = threadId != null && !threadId.isEmpty() ? threadId : UUID.randomUUID().toString();
                
                RunnableConfig runnableConfig = RunnableConfig.builder()
                        .threadId(finalThreadId)
                        .addMetadata("user_id", userId != null ? userId : "1")
                        .build();

                emitter.send(SseEmitter.event().name("threadId").data(finalThreadId));

                Optional<com.alibaba.cloud.ai.graph.OverAllState> result = supervisorAgent.invoke(message, runnableConfig);
                String fullResponse = result.isPresent() ? extractResponseFromState(result.get()) : "未获取到响应";

                // 模拟流式输出
                if (fullResponse != null && !fullResponse.isEmpty()) {
                    int chunkSize = 3;
                    for (int i = 0; i < fullResponse.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, fullResponse.length());
                        String chunk = fullResponse.substring(i, end);
                        emitter.send(SseEmitter.event().name("message").data(chunk));
                        Thread.sleep(50);
                    }
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("调用失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Override
    public SseEmitter sequentialChatStream(String message, String threadId, String userId, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                String finalThreadId = threadId != null && !threadId.isEmpty() ? threadId : UUID.randomUUID().toString();
                
                RunnableConfig runnableConfig = RunnableConfig.builder()
                        .threadId(finalThreadId)
                        .addMetadata("user_id", userId != null ? userId : "1")
                        .build();

                emitter.send(SseEmitter.event().name("threadId").data(finalThreadId));

                Optional<com.alibaba.cloud.ai.graph.OverAllState> result = sequentialAgent.invoke(message, runnableConfig);
                String fullResponse = result.isPresent() ? extractResponseFromState(result.get()) : "未获取到响应";

                // 模拟流式输出
                if (fullResponse != null && !fullResponse.isEmpty()) {
                    int chunkSize = 3;
                    for (int i = 0; i < fullResponse.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, fullResponse.length());
                        String chunk = fullResponse.substring(i, end);
                        emitter.send(SseEmitter.event().name("message").data(chunk));
                        Thread.sleep(50);
                    }
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("调用失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Override
    public SseEmitter coordinatorChatStream(String message, String threadId, String userId, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                String finalThreadId = threadId != null && !threadId.isEmpty() ? threadId : UUID.randomUUID().toString();
                
                RunnableConfig runnableConfig = RunnableConfig.builder()
                        .threadId(finalThreadId)
                        .addMetadata("user_id", userId != null ? userId : "1")
                        .build();

                emitter.send(SseEmitter.event().name("threadId").data(finalThreadId));

                AssistantMessage assistantMessage = coordinatorAgent.call(message, runnableConfig);
                String fullResponse = assistantMessage.getText();

                // 模拟流式输出
                if (fullResponse != null && !fullResponse.isEmpty()) {
                    int chunkSize = 3;
                    for (int i = 0; i < fullResponse.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, fullResponse.length());
                        String chunk = fullResponse.substring(i, end);
                        emitter.send(SseEmitter.event().name("message").data(chunk));
                        Thread.sleep(50);
                    }
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("调用失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * 从状态中提取响应文本
     */
    private String extractResponseFromState(com.alibaba.cloud.ai.graph.OverAllState state) {
        // 尝试从不同的输出键中提取响应
        if (state.value("weather_output").isPresent()) {
            Object output = state.value("weather_output").get();
            return output instanceof AssistantMessage ? ((AssistantMessage) output).getText() : output.toString();
        }
        if (state.value("location_output").isPresent()) {
            Object output = state.value("location_output").get();
            return output instanceof AssistantMessage ? ((AssistantMessage) output).getText() : output.toString();
        }
        if (state.value("analysis_output").isPresent()) {
            Object output = state.value("analysis_output").get();
            return output instanceof AssistantMessage ? ((AssistantMessage) output).getText() : output.toString();
        }
        if (state.value("weather").isPresent()) {
            Object output = state.value("weather").get();
            return output instanceof AssistantMessage ? ((AssistantMessage) output).getText() : output.toString();
        }
        if (state.value("analysis").isPresent()) {
            Object output = state.value("analysis").get();
            return output instanceof AssistantMessage ? ((AssistantMessage) output).getText() : output.toString();
        }
        // 如果没有找到特定输出，返回状态的字符串表示
        return state.toString();
    }
}

