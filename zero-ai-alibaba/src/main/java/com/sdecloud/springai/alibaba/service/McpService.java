package com.sdecloud.springai.alibaba.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * MCP 服务接口
 */
public interface McpService {
    /**
     * 获取 MCP 工具列表
     *
     * @return 工具列表
     */
    Map<String, Object> getTools();

    /**
     * 调用 MCP 工具
     *
     * @param toolName 工具名称
     * @param params 工具参数
     * @return 调用结果
     */
    Map<String, Object> callTool(String toolName, Map<String, Object> params);

    /**
     * 流式调用 MCP 工具
     *
     * @param toolName 工具名称
     * @param params 工具参数
     * @return SSE Emitter
     */
    SseEmitter streamCall(String toolName, Map<String, Object> params);

    /**
     * 获取 MCP 服务器状态
     *
     * @return 状态信息
     */
    Map<String, Object> getStatus();
}

