package com.sdecloud.springai.alibaba.service.impl;

import com.sdecloud.springai.alibaba.service.MemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 对话记忆服务实现类
 * 使用 Redis 进行持久化
 */
@Service
public class MemoryServiceImpl implements MemoryService {

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String THREAD_PREFIX = "thread:";
    private static final String HISTORY_PREFIX = "history:";

    @Override
    public List<Map<String, Object>> getHistory(String threadId) {
        List<Map<String, Object>> history = new ArrayList<>();

        // 注意：CheckPointer 通常通过 CompiledGraph 或 Agent 的 saver 访问
        // 这里简化实现，主要从 Redis 获取历史
        // 如果需要从 CheckPointer 获取，需要通过 CompiledGraph.getState() 方法
        try {
            // 尝试从 Redis 获取 checkpoint 数据
            String checkpointKey = "checkpoint:" + threadId;
            Object checkpointData = redisTemplate != null ? redisTemplate.opsForValue().get(checkpointKey) : null;
            if (checkpointData != null) {
                // 处理 checkpoint 数据
            }
        } catch (Exception e) {
            // 忽略
        }

        // 从 Redis 获取历史
        if (redisTemplate != null) {
            try {
                String key = HISTORY_PREFIX + threadId;
                Object historyData = redisTemplate.opsForValue().get(key);
                if (historyData instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> redisHistory = (List<Map<String, Object>>) historyData;
                    history.addAll(redisHistory);
                }
            } catch (Exception e) {
                // Redis 不可用，返回空列表
            }
        }


        return history;
    }

    @Override
    public void clearHistory(String threadId) {
        // 清除 CheckPointer 中的记录（需要通过 CompiledGraph 或 Agent 的 saver）
        // 这里简化实现，主要清除 Redis 中的记录
        try {
            String checkpointKey = "checkpoint:" + threadId;
            if (redisTemplate != null) {
                redisTemplate.delete(checkpointKey);
            }
        } catch (Exception e) {
            // 忽略错误
        }

        // 清除 Redis 中的记录
        if (redisTemplate != null) {
            try {
                String historyKey = HISTORY_PREFIX + threadId;
                String threadKey = THREAD_PREFIX + threadId;
                redisTemplate.delete(historyKey);
                redisTemplate.delete(threadKey);
            } catch (Exception e) {
                // 忽略错误
            }
        }
    }

    @Override
    public List<String> getAllThreads() {
        List<String> threads = new ArrayList<>();

        if (redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys(THREAD_PREFIX + "*");
                if (keys != null) {
                    threads = keys.stream()
                            .map(key -> key.replace(THREAD_PREFIX, ""))
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                // Redis 不可用，返回空列表
            }
        }

        return threads;
    }

    @Override
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("checkPointerAvailable", false); // 需要通过 CompiledGraph 访问
        status.put("redisAvailable", redisTemplate != null);
        status.put("threadCount", getAllThreads().size());
        return status;
    }
}

