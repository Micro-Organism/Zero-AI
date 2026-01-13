package com.sdecloud.springai.alibaba.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdecloud.springai.alibaba.common.config.DifyToolsConfig;
import com.sdecloud.springai.alibaba.common.domain.DifyAppConfig;
import com.sdecloud.springai.alibaba.service.DifyAppConfigService;
import com.sdecloud.springai.alibaba.service.DifyService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Dify 应用配置服务实现
 */
@Service
@Slf4j
public class DifyAppConfigServiceImpl implements DifyAppConfigService {
    
    @Autowired
    @org.springframework.context.annotation.Lazy
    private DifyService difyService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private DifyToolsConfig difyToolsConfig;
    
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);
    
    // 使用内存存储（后续可以迁移到数据库）
    private final Map<Long, DifyAppConfig> configMap = new ConcurrentHashMap<>();
    private final Map<String, DifyAppConfig> configByAppIdMap = new ConcurrentHashMap<>();
    private long nextId = 1;
    
    @PostConstruct
    public void init() {
        // 从配置文件动态加载应用配置
        initConfigsFromYaml();
        log.info("Dify 应用配置服务初始化完成，共 {} 个应用", configMap.size());
    }
    
    /**
     * 从 application-dev.yml 读取配置
     */
    private void initConfigsFromYaml() {
        Map<String, DifyToolsConfig.AppConfig> apps = difyToolsConfig.getAllApps();
        
        for (Map.Entry<String, DifyToolsConfig.AppConfig> entry : apps.entrySet()) {
            DifyToolsConfig.AppConfig appConfig = entry.getValue();
            if (appConfig == null || appConfig.getAppid() == null) {
                continue;
            }
            
            // 根据应用描述判断 API 类型
            String appType = determineAppType(appConfig.getDescription(), appConfig.getName(), appConfig.getAppid());
            // 根据 API 类型和应用ID确定输入参数模板
            String inputTemplate = determineInputTemplate(appType, appConfig.getAppid(), appConfig.getName());
            
            createConfig(
                appConfig.getName(),
                appConfig.getAppid(),
                appType,
                inputTemplate,
                appConfig.getDescription(),
                appConfig.getKey()
            );
            
            log.info("加载应用配置: {} ({}) - 类型: {}", appConfig.getName(), appConfig.getAppid(), appType);
        }
    }
    
    /**
     * 根据描述和名称判断应用类型
     */
    private String determineAppType(String description, String name, String appId) {
        if (description == null) description = "";
        if (name == null) name = "";
        
        String lowerDesc = description.toLowerCase();
        String lowerName = name.toLowerCase();
        
        // 根据应用ID判断（优先）
        if ("c46e6278-529e-4baf-9689-82e36f71ccfd".equals(appId)) {
            return "completion";
        } else if ("38f38794-bc62-49ab-b054-4669732e8ed0".equals(appId)) {
            return "workflow";
        } else if ("c41834f1-e70c-4c96-8722-eabbbffa1969".equals(appId) ||
                   "99a1cba2-8c35-472a-b98b-58f2ad261f3f".equals(appId) ||
                   "59cdfbd2-7826-4f34-83a6-cec16224bc57".equals(appId)) {
            return "chat";
        }
        
        // 如果包含 "chat" 或 "对话"，使用 chat-messages
        if (lowerDesc.contains("对话") || lowerDesc.contains("chat") || 
            lowerName.contains("对话") || lowerName.contains("chat")) {
            return "chat";
        }
        
        // 如果包含 "workflow" 或 "工作流"，使用 workflow
        if (lowerDesc.contains("workflow") || lowerDesc.contains("工作流") ||
            lowerName.contains("workflow") || lowerName.contains("工作流")) {
            return "workflow";
        }
        
        // 默认使用 completion
        return "completion";
    }
    
    /**
     * 根据应用类型和名称确定输入参数模板
     */
    private String determineInputTemplate(String appType, String appId, String name) {
        // 根据应用ID和应用名称确定具体的输入模板
        if ("c46e6278-529e-4baf-9689-82e36f71ccfd".equals(appId)) {
            // 文本生成应用测试 - completion
            return "{\"meeting_content\": \"\"}";
        } else if ("c41834f1-e70c-4c96-8722-eabbbffa1969".equals(appId)) {
            // 面试官助手 - chat with jobname
            return "{\"jobname\": \"\", \"query\": \"\"}";
        } else if ("99a1cba2-8c35-472a-b98b-58f2ad261f3f".equals(appId)) {
            // 调研分析报告编写助手 - chat with user_request and knowledge_base
            return "{\"user_request\": \"\", \"knowledge_base\": \"\", \"query\": \"\"}";
        } else if ("59cdfbd2-7826-4f34-83a6-cec16224bc57".equals(appId)) {
            // 分析报告生成助手 - chat
            return "{\"query\": \"\"}";
        } else if ("38f38794-bc62-49ab-b054-4669732e8ed0".equals(appId)) {
            // 测试知识库问答 - workflow
            return "{\"query\": \"\"}";
        }
        
        // 根据应用类型确定默认模板
        switch (appType) {
            case "chat":
                // chat-messages 使用 query 参数
                return "{\"query\": \"\"}";
            case "workflow":
                // workflow 使用 inputs.query
                return "{\"query\": \"\"}";
            case "completion":
            default:
                // completion-messages 使用 meeting_content 或其他自定义参数
                return "{\"meeting_content\": \"\"}";
        }
    }
    
    private DifyAppConfig createConfig(String name, String appId, String appType, 
                                      String inputTemplate, String description, String apiKey) {
        DifyAppConfig config = new DifyAppConfig();
        config.setId(nextId++);
        config.setName(name);
        config.setAppId(appId);
        config.setAppType(appType);
        config.setInputTemplate(inputTemplate);
        config.setDescription(description);
        config.setApiKey(apiKey);
        config.setEnabled(true);
        config.setSortOrder(0);
        config.setCreateTime(LocalDateTime.now());
        config.setUpdateTime(LocalDateTime.now());
        
        configMap.put(config.getId(), config);
        configByAppIdMap.put(config.getAppId(), config);
        return config;
    }
    
    @Override
    public List<DifyAppConfig> getAll() {
        return new ArrayList<>(configMap.values());
    }
    
    @Override
    public List<DifyAppConfig> getAllEnabled() {
        return configMap.values().stream()
            .filter(DifyAppConfig::getEnabled)
            .sorted(Comparator.comparing(DifyAppConfig::getSortOrder)
                .thenComparing(DifyAppConfig::getCreateTime))
            .collect(Collectors.toList());
    }
    
    @Override
    public DifyAppConfig getById(Long id) {
        DifyAppConfig config = configMap.get(id);
        if (config == null) {
            throw new RuntimeException("应用配置不存在: " + id);
        }
        return config;
    }
    
    @Override
    public DifyAppConfig getByAppId(String appId) {
        DifyAppConfig config = configByAppIdMap.get(appId);
        if (config == null) {
            throw new RuntimeException("应用配置不存在: " + appId);
        }
        return config;
    }
    
    @Override
    public DifyAppConfig create(DifyAppConfig config) {
        // 检查应用ID是否已存在
        if (configByAppIdMap.containsKey(config.getAppId())) {
            throw new RuntimeException("应用ID已存在: " + config.getAppId());
        }
        
        if (config.getEnabled() == null) {
            config.setEnabled(true);
        }
        if (config.getSortOrder() == null) {
            config.setSortOrder(0);
        }
        
        config.setId(nextId++);
        config.setCreateTime(LocalDateTime.now());
        config.setUpdateTime(LocalDateTime.now());
        
        configMap.put(config.getId(), config);
        configByAppIdMap.put(config.getAppId(), config);
        
        return config;
    }
    
    @Override
    public DifyAppConfig update(Long id, DifyAppConfig config) {
        DifyAppConfig existing = getById(id);
        
        // 如果修改了应用ID，检查新ID是否已存在
        if (!existing.getAppId().equals(config.getAppId())) {
            if (configByAppIdMap.containsKey(config.getAppId())) {
                throw new RuntimeException("应用ID已存在: " + config.getAppId());
            }
            // 更新索引
            configByAppIdMap.remove(existing.getAppId());
            configByAppIdMap.put(config.getAppId(), existing);
        }
        
        existing.setName(config.getName());
        existing.setAppId(config.getAppId());
        existing.setApiKey(config.getApiKey());
        existing.setAppType(config.getAppType());
        existing.setInputTemplate(config.getInputTemplate());
        existing.setDescription(config.getDescription());
        existing.setEnabled(config.getEnabled());
        existing.setSortOrder(config.getSortOrder());
        existing.setRemark(config.getRemark());
        existing.setUpdateTime(LocalDateTime.now());
        
        return existing;
    }
    
    @Override
    public void delete(Long id) {
        DifyAppConfig config = getById(id);
        configMap.remove(id);
        configByAppIdMap.remove(config.getAppId());
    }
    
    @Override
    public List<Map<String, Object>> batchCall(List<String> appIds, Map<String, Object> inputs, boolean stream) {
        if (appIds == null || appIds.isEmpty()) {
            throw new RuntimeException("应用ID列表不能为空");
        }
        
        log.info("批量调用应用, 数量: {}, 流式: {}", appIds.size(), stream);
        
        // 获取应用配置
        List<DifyAppConfig> configs = appIds.stream()
            .map(appId -> {
                try {
                    return getByAppId(appId);
                } catch (Exception e) {
                    log.warn("应用配置不存在: {}, 跳过", appId);
                    return null;
                }
            })
            .filter(Objects::nonNull)
            .filter(DifyAppConfig::getEnabled)
            .collect(Collectors.toList());
        
        if (configs.isEmpty()) {
            throw new RuntimeException("没有可用的应用配置");
        }
        
        // 并行调用
        List<CompletableFuture<Map<String, Object>>> futures = configs.stream()
            .map(config -> CompletableFuture.supplyAsync(() -> {
                try {
                    // 合并输入参数：先使用配置的模板，再覆盖用户输入
                    Map<String, Object> finalInputs = new HashMap<>();
                    
                    // 解析配置的输入模板
                    if (config.getInputTemplate() != null && !config.getInputTemplate().isEmpty()) {
                        try {
                            Map<String, Object> template = objectMapper.readValue(
                                config.getInputTemplate(),
                                new TypeReference<Map<String, Object>>() {}
                            );
                            finalInputs.putAll(template);
                        } catch (Exception e) {
                            log.warn("解析输入模板失败: {}", config.getInputTemplate(), e);
                        }
                    }
                    
                    // 用户输入覆盖模板
                    if (inputs != null) {
                        finalInputs.putAll(inputs);
                    }
                    
                    // 调用 Dify API
                    if (stream) {
                        // 流式调用暂不支持批量，返回提示
                        Map<String, Object> result = new HashMap<>();
                        result.put("appId", config.getAppId());
                        result.put("appName", config.getName());
                        result.put("error", true);
                        result.put("message", "批量调用暂不支持流式模式");
                        return result;
                    } else {
                        Map<String, Object> result = new HashMap<>();
                        result.put("appId", config.getAppId());
                        result.put("appName", config.getName());
                        
                        try {
                            // 获取应用的 API Key（优先使用应用配置的，否则使用全局的）
                            String appApiKey = config.getApiKey();
                            
                            // 根据应用类型调用不同的 API
                            Map<String, Object> apiResult;
                            if ("chat".equals(config.getAppType())) {
                                // chat-messages API: 需要 query 参数
                                Map<String, Object> chatInputs = new HashMap<>(finalInputs);
                                String query = (String) chatInputs.remove("query");
                                if (query == null || query.isEmpty()) {
                                    // 如果没有 query，尝试从其他字段获取
                                    query = (String) chatInputs.values().stream()
                                        .filter(v -> v instanceof String && !((String) v).isEmpty())
                                        .findFirst()
                                        .map(Object::toString)
                                        .orElse("Hello, world!");
                                }
                                chatInputs.put("query", query);
                                // 使用接口方法，传入 API Key
                                apiResult = difyService.chat(
                                    new ArrayList<>(), 
                                    config.getAppId(), 
                                    chatInputs,
                                    appApiKey
                                );
                            } else {
                                // completion-messages API
                                // 使用接口方法，传入 API Key
                                apiResult = difyService.chat(
                                    new ArrayList<>(), 
                                    config.getAppId(), 
                                    finalInputs,
                                    appApiKey
                                );
                            }
                            
                            result.put("success", !apiResult.containsKey("error") || !(Boolean) apiResult.getOrDefault("error", false));
                            result.put("data", apiResult);
                        } catch (Exception e) {
                            log.error("调用应用失败: {}", config.getAppId(), e);
                            result.put("success", false);
                            result.put("error", true);
                            result.put("message", e.getMessage());
                        }
                        
                        return result;
                    }
                } catch (Exception e) {
                    log.error("处理应用配置失败: {}", config.getAppId(), e);
                    Map<String, Object> result = new HashMap<>();
                    result.put("appId", config.getAppId());
                    result.put("appName", config.getName());
                    result.put("success", false);
                    result.put("error", true);
                    result.put("message", e.getMessage());
                    return result;
                }
            }, executorService))
            .collect(Collectors.toList());
        
        // 等待所有调用完成
        return futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
    }
}

