package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.McpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

/**
 * MCP（Model Context Protocol）Controller
 * 提供 MCP 服务器和客户端功能
 */
@RestController
@RequestMapping("/api/mcp")
public class McpController {

    @Autowired
    private McpService mcpService;

    /**
     * 获取 MCP 工具列表
     *
     * @return 工具列表
     */
    @GetMapping("/tools")
    public ResponseEntity<Map<String, Object>> getTools() {
        Map<String, Object> result = mcpService.getTools();
        return ResponseEntity.ok(result);
    }

    /**
     * 调用 MCP 工具
     *
     * @param request 工具调用请求
     * @return 调用结果
     */
    @PostMapping("/call")
    public ResponseEntity<Map<String, Object>> callTool(@RequestBody Map<String, Object> request) {
        String toolName = (String) request.get("toolName");
        Map<String, Object> params = (Map<String, Object>) request.get("params");
        
        Map<String, Object> result = mcpService.callTool(toolName, params);
        return ResponseEntity.ok(result);
    }

    /**
     * 流式调用 MCP 工具
     *
     * @param response HTTP 响应对象
     * @param request 工具调用请求
     * @return SSE 流
     */
    @PostMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamCall(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        String toolName = (String) request.get("toolName");
        Map<String, Object> params = (Map<String, Object>) request.get("params");

        return mcpService.streamCall(toolName, params);
    }

    /**
     * 获取 MCP 服务器状态
     *
     * @return 状态信息
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> result = mcpService.getStatus();
        return ResponseEntity.ok(result);
    }
}

