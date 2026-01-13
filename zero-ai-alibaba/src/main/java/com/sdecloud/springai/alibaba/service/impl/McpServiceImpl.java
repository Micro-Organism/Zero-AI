package com.sdecloud.springai.alibaba.service.impl;

import com.sdecloud.springai.alibaba.service.McpService;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * MCP 服务实现类
 * 注意：这是一个简化实现，完整的 MCP 需要配置 MCP 服务器和客户端
 */
@Service
public class McpServiceImpl implements McpService {

    // 模拟工具列表
    private final Map<String, Map<String, Object>> tools = new HashMap<>();

    public McpServiceImpl() {
        // 初始化示例工具
        tools.put("get_weather", Map.of(
                "name", "get_weather",
                "description", "获取天气信息",
                "parameters", Map.of(
                        "location", Map.of("type", "string", "description", "城市名称")
                )
        ));
        tools.put("get_time", Map.of(
                "name", "get_time",
                "description", "获取当前时间",
                "parameters", Map.of()
        ));
    }

    @Override
    public Map<String, Object> getTools() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("tools", new ArrayList<>(tools.values()));
        result.put("count", tools.size());
        return result;
    }

    @Override
    public Map<String, Object> callTool(String toolName, Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();

        if (!tools.containsKey(toolName)) {
            result.put("success", false);
            result.put("error", "工具不存在: " + toolName);
            return result;
        }

        try {
            // 模拟工具调用
            String response = switch (toolName) {
                case "get_weather" -> {
                    String location = (String) params.getOrDefault("location", "北京");
                    yield String.format("%s的天气：晴天，温度25°C", location);
                }
                case "get_time" -> {
                    yield "当前时间：" + new Date();
                }
                default -> "工具执行成功";
            };

            result.put("success", true);
            result.put("toolName", toolName);
            result.put("result", response);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "工具调用失败: " + e.getMessage());
        }

        return result;
    }

    @Override
    public SseEmitter streamCall(String toolName, Map<String, Object> params) {
        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> result = callTool(toolName, params);
                String response = (String) result.get("result");

                if (response != null) {
                    // 模拟流式输出
                    String[] words = response.split(" ");
                    for (String word : words) {
                        emitter.send(SseEmitter.event()
                                .name("message")
                                .data(word + " "));
                        Thread.sleep(50);
                    }
                }

                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(""));

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("工具调用失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Override
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("available", true);
        status.put("toolCount", tools.size());
        status.put("message", "MCP 服务运行正常");
        return status;
    }
}

