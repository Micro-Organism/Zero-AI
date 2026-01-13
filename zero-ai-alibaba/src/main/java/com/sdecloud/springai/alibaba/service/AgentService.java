package com.sdecloud.springai.alibaba.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Agent 服务类
 */
public interface AgentService {

    /**
     * 调用 Agent 进行对话
     *
     * @param message 用户消息
     * @param threadId 对话线程ID，如果为null则创建新的对话
     * @param userId 用户ID
     * @param modelType 模型类型（qwen/deepseek）
     * @return Agent 响应
     */
    String chat(String message, String threadId, String userId, String modelType);

    /**
     * 调用 Agent 进行对话（使用默认用户ID和默认模型）
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @return Agent 响应
     */
    String chat(String message, String threadId);

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
    SseEmitter chatStream(String message, String threadId, String userId, String modelType, HttpServletResponse response);
}

