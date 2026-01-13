package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.ChatService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/**
 * Chat API 控制器（基于 ChatClient）
 * 提供简单的流式对话功能
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * 流式对话接口
     * 参考 playground 的实现方式
     *
     * @param response HTTP 响应对象
     * @param prompt 用户消息
     * @param model 模型名称（可选，默认使用 deepseek-chat）
     * @param chatId 对话ID（可选，用于记忆管理）
     * @return 流式响应
     */
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chat(
            HttpServletResponse response,
            @Validated @RequestBody String prompt,
            @RequestHeader(value = "model", required = false) String model,
            @RequestHeader(value = "chatId", required = false, defaultValue = "default-chat") String chatId
    ) {
        // 设置响应头
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");

        // 验证 prompt
        if (!StringUtils.hasText(prompt)) {
            return Flux.just("错误：消息不能为空");
        }

        // 调用服务
        return chatService.chat(prompt, chatId, model);
    }

    /**
     * GET 方式的流式对话接口（用于测试）
     */
    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatGet(
            HttpServletResponse response,
            @RequestParam String prompt,
            @RequestParam(required = false) String model,
            @RequestParam(required = false, defaultValue = "default-chat") String chatId
    ) {
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");

        if (!StringUtils.hasText(prompt)) {
            return Flux.just("错误：消息不能为空");
        }

        return chatService.chat(prompt, chatId, model);
    }
}

