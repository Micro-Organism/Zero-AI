package com.sdecloud.springai.alibaba.service;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;

/**
 * 多智能体服务接口
 */
public interface MultiAgentService {

    /**
     * SupervisorAgent 模式：监督者协调多个专业 Agent
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @return Agent 响应
     */
    String supervisorChat(String message, String threadId, String userId);

    /**
     * SequentialAgent 模式：顺序执行多个 Agent
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @return Agent 响应
     */
    String sequentialChat(String message, String threadId, String userId);

    /**
     * CoordinatorAgent 模式：Agent 作为工具调用
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @return Agent 响应
     */
    String coordinatorChat(String message, String threadId, String userId);

    /**
     * SupervisorAgent 流式对话
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @param response HTTP 响应对象
     * @return SSE Emitter
     */
    SseEmitter supervisorChatStream(String message, String threadId, String userId, HttpServletResponse response);

    /**
     * SequentialAgent 流式对话
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @param response HTTP 响应对象
     * @return SSE Emitter
     */
    SseEmitter sequentialChatStream(String message, String threadId, String userId, HttpServletResponse response);

    /**
     * CoordinatorAgent 流式对话
     *
     * @param message 用户消息
     * @param threadId 对话线程ID
     * @param userId 用户ID
     * @param response HTTP 响应对象
     * @return SSE Emitter
     */
    SseEmitter coordinatorChatStream(String message, String threadId, String userId, HttpServletResponse response);
}

