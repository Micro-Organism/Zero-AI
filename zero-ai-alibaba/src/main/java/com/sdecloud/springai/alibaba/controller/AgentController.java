package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * Agent API 控制器
 */
@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private AgentService agentService;

    /**
     * 发送消息给 Agent
     *
     * @param request 请求体，包含 message, threadId, userId, modelType
     * @return Agent 响应
     */
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");
        String modelType = request.getOrDefault("modelType", "deepseek"); // 默认使用 deepseek

        if (message == null || message.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "消息不能为空");
            return error;
        }

        String response = agentService.chat(message, threadId, userId, modelType);

        Map<String, Object> result = new HashMap<>();
        result.put("response", response);
        result.put("threadId", threadId);
        result.put("modelType", modelType);
        return result;
    }

    /**
     * 简单的 GET 接口用于测试
     *
     * @param message 用户消息
     * @return Agent 响应
     */
    @GetMapping("/chat")
    public Map<String, Object> chatGet(@RequestParam String message,
                                        @RequestParam(required = false) String threadId,
                                        @RequestParam(required = false) String userId,
                                        @RequestParam(required = false, defaultValue = "deepseek") String modelType) {
        String response = agentService.chat(message, threadId, userId, modelType);

        Map<String, Object> result = new HashMap<>();
        result.put("response", response);
        result.put("threadId", threadId);
        result.put("modelType", modelType);
        return result;
    }

    /**
     * SSE 流式对话接口
     *
     * @param request 请求体，包含 message, threadId, userId, modelType
     * @param response HTTP 响应对象
     * @return SSE Emitter
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody Map<String, String> request,
                                  HttpServletResponse response) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");
        String modelType = request.getOrDefault("modelType", "deepseek"); // 默认使用 deepseek

        if (message == null || message.isEmpty()) {
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("消息不能为空"));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        return agentService.chatStream(message, threadId, userId, modelType, response);
    }
}

