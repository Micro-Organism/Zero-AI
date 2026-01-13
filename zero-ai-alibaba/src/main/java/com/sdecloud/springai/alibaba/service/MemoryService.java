package com.sdecloud.springai.alibaba.service;

import java.util.List;
import java.util.Map;

/**
 * 对话记忆服务接口
 */
public interface MemoryService {
    /**
     * 获取对话历史
     *
     * @param threadId 对话线程ID
     * @return 对话历史列表
     */
    List<Map<String, Object>> getHistory(String threadId);

    /**
     * 清空对话历史
     *
     * @param threadId 对话线程ID
     */
    void clearHistory(String threadId);

    /**
     * 获取所有对话线程列表
     *
     * @return 线程ID列表
     */
    List<String> getAllThreads();

    /**
     * 获取记忆状态
     *
     * @return 状态信息
     */
    Map<String, Object> getStatus();
}

