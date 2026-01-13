package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.MemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 对话记忆管理 Controller
 * 提供记忆持久化、查询、删除等功能
 */
@RestController
@RequestMapping("/api/memory")
public class MemoryController {

    @Autowired
    private MemoryService memoryService;

    /**
     * 获取对话历史
     *
     * @param threadId 对话线程ID
     * @return 对话历史列表
     */
    @GetMapping("/history/{threadId}")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@PathVariable String threadId) {
        List<Map<String, Object>> history = memoryService.getHistory(threadId);
        return ResponseEntity.ok(history);
    }

    /**
     * 清空对话历史
     *
     * @param threadId 对话线程ID
     * @return 操作结果
     */
    @DeleteMapping("/history/{threadId}")
    public ResponseEntity<Map<String, Object>> clearHistory(@PathVariable String threadId) {
        memoryService.clearHistory(threadId);
        return ResponseEntity.ok(Map.of("success", true, "message", "对话历史已清空"));
    }

    /**
     * 获取所有对话线程列表
     *
     * @return 线程ID列表
     */
    @GetMapping("/threads")
    public ResponseEntity<List<String>> getThreads() {
        List<String> threads = memoryService.getAllThreads();
        return ResponseEntity.ok(threads);
    }

    /**
     * 检查记忆持久化状态
     *
     * @return 状态信息
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = memoryService.getStatus();
        return ResponseEntity.ok(status);
    }
}

