package com.sdecloud.springai.alibaba.service;

import reactor.core.publisher.Flux;

/**
 * Chat 服务接口（基于 ChatClient）
 * 提供简单的流式对话功能
 */
public interface ChatService {

    /**
     * 流式对话
     *
     * @param prompt 用户消息
     * @param chatId 对话ID，用于记忆管理
     * @param model 模型名称（可选，默认使用 deepseek-chat）
     * @return 流式响应
     */
    Flux<String> chat(String prompt, String chatId, String model);
}

