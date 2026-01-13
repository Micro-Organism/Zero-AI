package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.MultiAgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * 多智能体 API 控制器
 */
@RestController
@RequestMapping("/api/multi-agent")
public class MultiAgentController {

    @Autowired
    private MultiAgentService multiAgentService;

    /**
     * SupervisorAgent 模式对话
     */
    @PostMapping("/supervisor/chat")
    public Map<String, Object> supervisorChat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "消息不能为空");
            return error;
        }

        String response = multiAgentService.supervisorChat(message, threadId, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("response", response);
        result.put("threadId", threadId);
        result.put("mode", "supervisor");
        return result;
    }

    /**
     * SequentialAgent 模式对话
     */
    @PostMapping("/sequential/chat")
    public Map<String, Object> sequentialChat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "消息不能为空");
            return error;
        }

        String response = multiAgentService.sequentialChat(message, threadId, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("response", response);
        result.put("threadId", threadId);
        result.put("mode", "sequential");
        return result;
    }

    /**
     * CoordinatorAgent 模式对话
     */
    @PostMapping("/coordinator/chat")
    public Map<String, Object> coordinatorChat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "消息不能为空");
            return error;
        }

        String response = multiAgentService.coordinatorChat(message, threadId, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("response", response);
        result.put("threadId", threadId);
        result.put("mode", "coordinator");
        return result;
    }

    /**
     * SupervisorAgent 流式对话
     */
    @PostMapping(value = "/supervisor/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter supervisorChatStream(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.send(SseEmitter.event().name("error").data("消息不能为空"));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        return multiAgentService.supervisorChatStream(message, threadId, userId, response);
    }

    /**
     * SequentialAgent 流式对话
     */
    @PostMapping(value = "/sequential/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sequentialChatStream(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.send(SseEmitter.event().name("error").data("消息不能为空"));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        return multiAgentService.sequentialChatStream(message, threadId, userId, response);
    }

    /**
     * CoordinatorAgent 流式对话
     */
    @PostMapping(value = "/coordinator/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter coordinatorChatStream(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String message = request.get("message");
        String threadId = request.get("threadId");
        String userId = request.get("userId");

        if (message == null || message.isEmpty()) {
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.send(SseEmitter.event().name("error").data("消息不能为空"));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        return multiAgentService.coordinatorChatStream(message, threadId, userId, response);
    }
}

