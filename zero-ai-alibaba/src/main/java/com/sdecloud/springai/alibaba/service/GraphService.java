package com.sdecloud.springai.alibaba.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Graph 工作流服务接口
 */
public interface GraphService {
    /**
     * 执行简单 Graph 工作流
     *
     * @param message 用户消息
     * @param threadId 线程ID
     * @return 执行结果
     */
    Map<String, Object> executeSimpleGraph(String message, String threadId);

    /**
     * 流式执行 Graph 工作流
     *
     * @param message 用户消息
     * @param threadId 线程ID
     * @return SSE Emitter
     */
    SseEmitter streamGraph(String message, String threadId);

    /**
     * 执行并行 Graph 工作流
     *
     * @param message 用户消息
     * @param threadId 线程ID
     * @return 执行结果
     */
    Map<String, Object> executeParallelGraph(String message, String threadId);

    /**
     * 获取 Graph 状态
     *
     * @param threadId 线程ID
     * @return 状态信息
     */
    Map<String, Object> getGraphStatus(String threadId);
}

