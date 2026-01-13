package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.GraphService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Graph 工作流 Controller
 * 提供 Graph 工作流的创建、执行等功能
 */
@RestController
@RequestMapping("/api/graph")
public class GraphController {

    @Autowired
    private GraphService graphService;

    /**
     * 执行简单 Graph 工作流
     *
     * @param request 请求参数
     * @return 执行结果
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeGraph(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        String threadId = (String) request.getOrDefault("threadId", null);
        
        Map<String, Object> result = graphService.executeSimpleGraph(message, threadId);
        return ResponseEntity.ok(result);
    }

    /**
     * 流式执行 Graph 工作流
     *
     * @param response HTTP 响应对象
     * @param request 请求参数
     * @return SSE 流
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamGraph(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        String message = (String) request.get("message");
        String threadId = (String) request.getOrDefault("threadId", null);

        return graphService.streamGraph(message, threadId);
    }

    /**
     * 执行并行 Graph 工作流
     *
     * @param request 请求参数
     * @return 执行结果
     */
    @PostMapping("/parallel")
    public ResponseEntity<Map<String, Object>> executeParallelGraph(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        String threadId = (String) request.getOrDefault("threadId", null);
        
        Map<String, Object> result = graphService.executeParallelGraph(message, threadId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取 Graph 状态
     *
     * @param threadId 线程ID
     * @return 状态信息
     */
    @GetMapping("/status/{threadId}")
    public ResponseEntity<Map<String, Object>> getGraphStatus(@PathVariable String threadId) {
        Map<String, Object> status = graphService.getGraphStatus(threadId);
        return ResponseEntity.ok(status);
    }
}

