package com.sdecloud.springai.alibaba.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdecloud.springai.alibaba.service.DifyService;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.Base64;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Dify服务实现类
 * 基于Dify API实现工具调用、对话等功能
 */
@Service
@Slf4j
public class DifyServiceImpl implements DifyService {
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${dify.api.url:http://10.133.0.147:18082}")
    private String difyApiUrl;
    
    @Value("${dify.api.key:}")
    private String difyApiKey;
    
    @Value("${dify.api.username:}")
    private String difyUsername;
    
    @Value("${dify.api.password:}")
    private String difyPassword;
    
    public DifyServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
    
    /**
     * 在依赖注入完成后执行，打印配置信息
     * 注意：@Value 字段注入是在构造函数之后完成的，所以不能在构造函数中访问这些字段
     */
    @PostConstruct
    public void init() {
        // 启动时打印配置信息（用于调试，不打印敏感信息）
        log.info("Dify 配置加载完成:");
        log.info("  - API URL: {}", difyApiUrl);
        log.info("  - API Key: {}", (difyApiKey != null && !difyApiKey.isEmpty()) 
            ? (difyApiKey.length() > 10 ? difyApiKey.substring(0, 10) + "..." : difyApiKey) + " (长度: " + difyApiKey.length() + ")" 
            : "未配置");
        log.info("  - Username: {}", (difyUsername != null && !difyUsername.isEmpty()) ? difyUsername : "未配置");
        log.info("  - Password: {}", (difyPassword != null && !difyPassword.isEmpty()) ? "***" : "未配置");
    }
    
    @Override
    public Map<String, Object> callTool(String toolName, Map<String, Object> parameters) {
        try {
            log.info("调用Dify工具: {}, 参数: {}", toolName, parameters);
            
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("tool_name", toolName);
            requestBody.put("parameters", parameters);
            
            // 调用Dify API
            String url = difyApiUrl + "/v1/tools/invoke";
            Mono<Map> response = webClient.post()
                .uri(url)
                .headers(headers -> {
                    if (difyApiKey != null && !difyApiKey.isEmpty()) {
                        headers.setBearerAuth(difyApiKey);
                    } else if (difyUsername != null && !difyUsername.isEmpty()) {
                        String auth = Base64.getEncoder().encodeToString(
                            (difyUsername + ":" + difyPassword).getBytes()
                        );
                        headers.set("Authorization", "Basic " + auth);
                    }
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(60));
            
            Map<String, Object> result = response.block();
            log.info("Dify工具调用成功: {}", result);
            return result != null ? result : new HashMap<>();
            
        } catch (Exception e) {
            log.error("调用Dify工具失败", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", true);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Flux<String> callToolStream(String toolName, Map<String, Object> parameters) {
        try {
            log.info("流式调用Dify工具: {}, 参数: {}", toolName, parameters);
            
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("tool_name", toolName);
            requestBody.put("parameters", parameters);
            requestBody.put("stream", true);
            
            // 调用Dify API（流式）
            String url = difyApiUrl + "/v1/tools/invoke";
            return webClient.post()
                .uri(url)
                .headers(headers -> {
                    if (difyApiKey != null && !difyApiKey.isEmpty()) {
                        headers.setBearerAuth(difyApiKey);
                    } else if (difyUsername != null && !difyUsername.isEmpty()) {
                        String auth = Base64.getEncoder().encodeToString(
                            (difyUsername + ":" + difyPassword).getBytes()
                        );
                        headers.set("Authorization", "Basic " + auth);
                    }
                    headers.setAccept(Collections.singletonList(MediaType.TEXT_EVENT_STREAM));
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .timeout(Duration.ofSeconds(300))
                .onErrorResume(e -> {
                    log.error("流式调用Dify工具失败", e);
                    try {
                        return Flux.just("data: " + objectMapper.writeValueAsString(
                            Map.of("error", true, "message", e.getMessage())
                        ));
                    } catch (JsonProcessingException ex) {
                        return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}");
                    }
                });
            
        } catch (Exception e) {
            log.error("流式调用Dify工具失败", e);
            try {
                return Flux.just("data: " + objectMapper.writeValueAsString(
                    Map.of("error", true, "message", e.getMessage())
                ));
            } catch (JsonProcessingException ex) {
                return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}");
            }
        }
    }
    
    @Override
    public List<Map<String, Object>> getTools(String appId) {
        log.info("获取Dify工具列表, appId: {}", appId);
        
        // Dify API 没有全局工具列表接口，工具信息是应用级别的
        // 必须提供 appId 才能获取工具列表
        if (appId == null || appId.isEmpty()) {
            String errorMsg = "获取工具列表需要提供 appId 参数。Dify 没有全局工具列表接口，工具信息是应用级别的。";
            log.error(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }
        
        // 检查认证配置
        if ((difyApiKey == null || difyApiKey.isEmpty()) && 
            (difyUsername == null || difyUsername.isEmpty() || difyPassword == null || difyPassword.isEmpty())) {
            String errorMsg = "Dify 认证配置缺失。必须提供以下配置之一：1) dify.api.key (API Key) 或 2) dify.api.username 和 dify.api.password (Basic Auth)。请检查 application-dev.yml 或环境变量配置。";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        
        // 从应用详情获取工具列表
        return getToolsFromApp(appId);
    }
    
    /**
     * 从应用信息中获取工具列表
     */
    private List<Map<String, Object>> getToolsFromApp(String appId) {
        log.info("从应用获取工具列表, appId: {}", appId);
        
        // 优先尝试使用 console API 获取应用详情（管理接口）
        List<Map<String, Object>> tools = null;
        RuntimeException consoleApiError = null;
        
        try {
            tools = getToolsFromConsoleApi(appId);
            if (tools != null && !tools.isEmpty()) {
                return tools;
            }
        } catch (RuntimeException e) {
            consoleApiError = e;
            log.warn("Console API 获取工具列表失败: {}", e.getMessage());
        }
        
        // 如果console API失败，尝试使用 v1 API（注意：V1 API 可能不支持获取应用详情）
        log.info("Console API 失败，尝试使用 V1 API");
        try {
            String url = difyApiUrl + "/v1/apps/" + appId;
            log.info("请求V1 API获取应用详情, URL: {}", url);
            
            // V1 API 也使用 Bearer Token（API Key）
            if (difyApiKey != null && !difyApiKey.isEmpty()) {
                Mono<Map> response = webClient.get()
                    .uri(url)
                    .headers(headers -> {
                        headers.setBearerAuth(difyApiKey);
                        log.debug("使用Bearer Token认证, API Key: {}...", difyApiKey.length() > 10 ? difyApiKey.substring(0, 10) + "..." : difyApiKey);
                    })
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> {
                        if (clientResponse.statusCode().value() == 404) {
                            log.warn("V1 API 接口不存在 (404)，这是正常的，V1 API 不支持获取应用详情");
                            return Mono.empty();
                        }
                        return clientResponse.bodyToMono(String.class)
                            .flatMap(body -> {
                                log.warn("V1 API请求失败, 状态码: {}, 响应: {}", clientResponse.statusCode(), body);
                                return Mono.empty(); // 不抛出异常，返回空
                            });
                    })
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30));
                
                Map<String, Object> result = response.block();
                if (result != null) {
                    log.info("V1 API应用详情响应完整结构: {}", result);
                    List<Map<String, Object>> v1Tools = findToolsInMap(result);
                    if (v1Tools != null && !v1Tools.isEmpty()) {
                        log.info("从V1 API找到 {} 个工具", v1Tools.size());
                        return formatToolsFromConfigurations(v1Tools);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("V1 API 调用失败（这是正常的，V1 API 不支持获取应用详情）: {}", e.getMessage());
        }
        
        // 如果所有方法都失败，返回友好的错误信息
        // 注意：Console API 需要管理权限的 API Key，而当前的 API Key 可能只对 V1 API 有效
        if (consoleApiError != null && consoleApiError.getMessage() != null && 
            consoleApiError.getMessage().contains("401")) {
            String errorMsg = String.format(
                "无法获取应用 %s 的工具列表。当前 API Key 对 Console API 无效（返回 401）。" +
                "Console API 需要管理权限的 API Key，而当前的 API Key 只对 V1 API（公共 API）有效。" +
                "解决方案：1) 在 Dify 中创建具有管理权限的 API Key；2) 或者直接使用 V1 API 调用应用功能（不需要获取工具列表）。" +
                "注意：V1 API 可以正常使用，只是无法获取工具列表配置。",
                appId
            );
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
        
        // 其他错误
        String errorMsg = String.format(
            "无法获取应用 %s 的工具列表。可能的原因：1) API Key 对 Console API 无效（需要管理权限）；2) 应用不存在或未发布；3) 应用确实没有配置工具。" +
            "注意：即使无法获取工具列表，您仍然可以使用 V1 API 直接调用应用功能。",
            appId
        );
        log.error(errorMsg);
        throw new RuntimeException(errorMsg);
    }
    
    /**
     * 从Console API获取应用工具列表
     */
    private List<Map<String, Object>> getToolsFromConsoleApi(String appId) {
        String url = difyApiUrl + "/console/api/apps/" + appId;
        log.info("请求Console API获取应用详情, URL: {}", url);
        
        // 优先尝试 API Key，如果失败则尝试 Basic Auth
        List<Map<String, Object>> tools = null;
        RuntimeException lastError = null;
        
        // 尝试1：使用 API Key
        if (difyApiKey != null && !difyApiKey.isEmpty()) {
            log.info("尝试使用 API Key 认证, API Key: {}... (长度: {})", 
                difyApiKey.length() > 10 ? difyApiKey.substring(0, 10) : difyApiKey, 
                difyApiKey.length());
            try {
                tools = tryGetToolsWithApiKey(url, appId);
                if (tools != null && !tools.isEmpty()) {
                    return tools;
                }
            } catch (RuntimeException e) {
                lastError = e;
                log.warn("API Key 认证失败: {}", e.getMessage());
            }
        } else {
            log.warn("API Key 未配置或为空，跳过 API Key 认证");
        }
        
        // 尝试2：使用 Basic Auth（用户名密码）
        // 注意：Console API 可能不支持 Basic Auth，只支持 Bearer Token
        if (difyUsername != null && !difyUsername.isEmpty() && difyPassword != null && !difyPassword.isEmpty()) {
            log.warn("API Key 认证失败，尝试使用 Basic Auth 认证（注意：Console API 可能不支持 Basic Auth）");
            try {
                tools = tryGetToolsWithBasicAuth(url, appId);
                if (tools != null && !tools.isEmpty()) {
                    return tools;
                }
            } catch (RuntimeException e) {
                lastError = e;
                log.error("Basic Auth 认证也失败: {}", e.getMessage());
                // Console API 可能不支持 Basic Auth，只支持 Bearer Token
                if (e.getMessage() != null && e.getMessage().contains("Invalid Authorization header format")) {
                    log.error("Console API 不支持 Basic Auth，只支持 Bearer Token 认证。请使用有效的 API Key。");
                }
            }
        } else {
            log.warn("用户名密码未配置，跳过 Basic Auth 认证");
        }
        
        // 如果所有认证方式都失败，抛出明确的异常
        if (lastError != null) {
            throw lastError;
        }
        
        String errorMsg = "所有认证方式都失败。请检查：1) API Key 是否有效（dify.api.key）；2) 用户名密码是否正确（dify.api.username 和 dify.api.password）。";
        log.error(errorMsg);
        throw new RuntimeException(errorMsg);
    }
    
    /**
     * 使用 API Key 尝试获取工具列表
     */
    private List<Map<String, Object>> tryGetToolsWithApiKey(String url, String appId) {
        Mono<Map> response = webClient.get()
            .uri(url)
            .headers(headers -> {
                headers.setBearerAuth(difyApiKey);
                log.debug("使用Bearer Token认证, API Key: {}...", difyApiKey.length() > 10 ? difyApiKey.substring(0, 10) + "..." : difyApiKey);
            })
            .retrieve()
            .onStatus(status -> status.isError(), clientResponse -> {
                return clientResponse.bodyToMono(String.class)
                    .flatMap(body -> {
                        String errorMsg = String.format("Console API请求失败, 状态码: %s, 响应: %s", clientResponse.statusCode(), body);
                        log.error(errorMsg);
                        if (clientResponse.statusCode().value() == 401) {
                            return Mono.error(new RuntimeException("API Key 认证失败 (401): " + body + "。请检查 dify.api.key 配置是否正确，或该 API Key 是否已过期。"));
                        }
                        return Mono.error(new RuntimeException(errorMsg));
                    });
            })
            .bodyToMono(Map.class)
            .timeout(Duration.ofSeconds(30));
        
        Map<String, Object> result = response.block();
        if (result != null) {
            log.info("Console API应用详情响应完整结构: {}", result);
            return extractToolsFromResponse(result);
        }
        return null;
    }
    
    /**
     * 使用 Basic Auth 尝试获取工具列表
     */
    private List<Map<String, Object>> tryGetToolsWithBasicAuth(String url, String appId) {
        String auth = Base64.getEncoder().encodeToString(
            (difyUsername + ":" + difyPassword).getBytes()
        );
        log.debug("使用Basic认证, 用户名: {}", difyUsername);
        
        Mono<Map> response = webClient.get()
            .uri(url)
            .headers(headers -> {
                headers.set("Authorization", "Basic " + auth);
            })
            .retrieve()
            .onStatus(status -> status.isError(), clientResponse -> {
                return clientResponse.bodyToMono(String.class)
                    .flatMap(body -> {
                        String errorMsg;
                        if (body != null && body.contains("Invalid Authorization header format")) {
                            errorMsg = String.format("Basic Auth 认证失败, 状态码: %s, 响应: %s。Console API 可能不支持 Basic Auth，只支持 Bearer Token 认证。请使用有效的 API Key（dify.api.key）。", clientResponse.statusCode(), body);
                        } else {
                            errorMsg = String.format("Basic Auth 认证失败, 状态码: %s, 响应: %s。请检查 dify.api.username 和 dify.api.password 配置是否正确。", clientResponse.statusCode(), body);
                        }
                        log.error(errorMsg);
                        return Mono.error(new RuntimeException(errorMsg));
                    });
            })
            .bodyToMono(Map.class)
            .timeout(Duration.ofSeconds(30));
        
        Map<String, Object> result = response.block();
        if (result != null) {
            log.info("Console API应用详情响应完整结构 (Basic Auth): {}", result);
            return extractToolsFromResponse(result);
        }
        return new ArrayList<>();
    }
    
    /**
     * 从响应中提取工具列表
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractToolsFromResponse(Map<String, Object> result) {
        if (result == null) {
            return new ArrayList<>();
        }
        
        // 首先尝试从data字段获取
        Map<String, Object> data = null;
        if (result.containsKey("data")) {
            Object dataObj = result.get("data");
            if (dataObj instanceof Map) {
                data = (Map<String, Object>) dataObj;
            } else {
                // 如果data不是Map，直接使用result
                data = result;
            }
        } else {
            // 如果没有data字段，直接使用result
            data = result;
        }
        
        if (data != null) {
            // 递归搜索工具配置
            List<Map<String, Object>> tools = findToolsInMap(data);
            if (tools != null && !tools.isEmpty()) {
                log.info("从Console API找到 {} 个工具", tools.size());
                return formatToolsFromConfigurations(tools);
            }
        }
        
        log.warn("Console API响应中未找到工具配置");
        return new ArrayList<>();
    }
    
    /**
     * 递归搜索Map中的工具配置
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> findToolsInMap(Map<String, Object> map) {
        if (map == null) {
            return null;
        }
        
        // 1. 直接检查 tool_configurations
        if (map.containsKey("tool_configurations")) {
            Object toolConfigsObj = map.get("tool_configurations");
            if (toolConfigsObj instanceof List) {
                List<Map<String, Object>> toolConfigs = (List<Map<String, Object>>) toolConfigsObj;
                if (toolConfigs != null && !toolConfigs.isEmpty()) {
                    log.info("在 tool_configurations 字段找到工具配置");
                    return toolConfigs;
                }
            }
        }
        
        // 2. 检查 model_config.tools
        if (map.containsKey("model_config")) {
            Object modelConfigObj = map.get("model_config");
            if (modelConfigObj instanceof Map) {
                Map<String, Object> modelConfig = (Map<String, Object>) modelConfigObj;
                if (modelConfig.containsKey("tools")) {
                    Object toolsObj = modelConfig.get("tools");
                    if (toolsObj instanceof List) {
                        List<Map<String, Object>> tools = (List<Map<String, Object>>) toolsObj;
                        if (tools != null && !tools.isEmpty()) {
                            log.info("在 model_config.tools 字段找到工具配置");
                            return tools;
                        }
                    }
                }
            }
        }
        
        // 3. 检查 agent_config.tools
        if (map.containsKey("agent_config")) {
            Object agentConfigObj = map.get("agent_config");
            if (agentConfigObj instanceof Map) {
                Map<String, Object> agentConfig = (Map<String, Object>) agentConfigObj;
                if (agentConfig.containsKey("tools")) {
                    Object toolsObj = agentConfig.get("tools");
                    if (toolsObj instanceof List) {
                        List<Map<String, Object>> tools = (List<Map<String, Object>>) toolsObj;
                        if (tools != null && !tools.isEmpty()) {
                            log.info("在 agent_config.tools 字段找到工具配置");
                            return tools;
                        }
                    }
                }
            }
        }
        
        // 4. 直接检查 tools 字段
        if (map.containsKey("tools")) {
            Object toolsObj = map.get("tools");
            if (toolsObj instanceof List) {
                List<Map<String, Object>> tools = (List<Map<String, Object>>) toolsObj;
                if (tools != null && !tools.isEmpty()) {
                    log.info("在 tools 字段找到工具配置");
                    return tools;
                }
            }
        }
        
        // 5. 递归搜索所有嵌套的Map
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                List<Map<String, Object>> tools = findToolsInMap((Map<String, Object>) value);
                if (tools != null && !tools.isEmpty()) {
                    log.info("在嵌套字段 {} 中找到工具配置", entry.getKey());
                    return tools;
                }
            } else if (value instanceof List) {
                // 检查列表中是否包含工具配置
                List<?> list = (List<?>) value;
                for (Object item : list) {
                    if (item instanceof Map) {
                        List<Map<String, Object>> tools = findToolsInMap((Map<String, Object>) item);
                        if (tools != null && !tools.isEmpty()) {
                            return tools;
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 格式化工具配置为统一的工具列表格式
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> formatToolsFromConfigurations(List<Map<String, Object>> toolConfigs) {
        List<Map<String, Object>> formattedTools = new ArrayList<>();
        
        if (toolConfigs == null || toolConfigs.isEmpty()) {
            return formattedTools;
        }
        
        for (Map<String, Object> toolConfig : toolConfigs) {
            if (toolConfig == null) {
                continue;
            }
            
            Map<String, Object> tool = new HashMap<>();
            
            // 提取工具ID和名称 - 支持多种格式
            // 格式1: 直接包含 id, name 字段
            if (toolConfig.containsKey("id")) {
                tool.put("id", toolConfig.get("id"));
            }
            if (toolConfig.containsKey("name")) {
                tool.put("name", toolConfig.get("name"));
            }
            
            // 格式2: tool 字段包含工具信息
            if (toolConfig.containsKey("tool")) {
                Object toolObj = toolConfig.get("tool");
                if (toolObj instanceof Map) {
                    Map<String, Object> toolMap = (Map<String, Object>) toolObj;
                    
                    // 从 identity 字段获取
                    if (toolMap.containsKey("identity")) {
                        Object identityObj = toolMap.get("identity");
                        if (identityObj instanceof Map) {
                            Map<String, Object> identity = (Map<String, Object>) identityObj;
                            if (identity.containsKey("name") && !tool.containsKey("id")) {
                                tool.put("id", identity.get("name"));
                            }
                            if (identity.containsKey("author") && !tool.containsKey("author")) {
                                tool.put("author", identity.get("author"));
                            }
                        }
                    }
                    
                    // 从 tool 对象直接获取
                    if (toolMap.containsKey("name") && !tool.containsKey("name")) {
                        tool.put("name", toolMap.get("name"));
                    }
                    if (toolMap.containsKey("description") && !tool.containsKey("description")) {
                        tool.put("description", toolMap.get("description"));
                    }
                    if (toolMap.containsKey("parameters") && !tool.containsKey("parameters")) {
                        tool.put("parameters", toolMap.get("parameters"));
                    }
                } else if (toolObj instanceof String) {
                    String toolName = (String) toolObj;
                    if (!tool.containsKey("id")) {
                        tool.put("id", toolName);
                    }
                    if (!tool.containsKey("name")) {
                        tool.put("name", toolName);
                    }
                }
            }
            
            // 格式3: tool_name 字段
            if (toolConfig.containsKey("tool_name")) {
                String toolName = String.valueOf(toolConfig.get("tool_name"));
                if (!tool.containsKey("id")) {
                    tool.put("id", toolName);
                }
                if (!tool.containsKey("name")) {
                    tool.put("name", toolName);
                }
            }
            
            // 格式4: provider_id 和 provider_type (对于某些工具)
            if (toolConfig.containsKey("provider_id")) {
                if (!tool.containsKey("id")) {
                    tool.put("id", toolConfig.get("provider_id"));
                }
            }
            if (toolConfig.containsKey("provider_type")) {
                if (!tool.containsKey("type")) {
                    tool.put("type", toolConfig.get("provider_type"));
                }
            }
            
            // 提取工具描述
            if (!tool.containsKey("description")) {
                if (toolConfig.containsKey("description")) {
                    tool.put("description", toolConfig.get("description"));
                }
            }
            
            // 提取工具参数
            if (toolConfig.containsKey("parameters")) {
                tool.put("parameters", toolConfig.get("parameters"));
            }
            
            // 提取是否启用
            if (toolConfig.containsKey("enabled")) {
                tool.put("enabled", toolConfig.get("enabled"));
            }
            
            // 确保至少有一个标识符
            if (!tool.containsKey("id") && !tool.containsKey("name")) {
                // 如果都没有，尝试从其他字段推断
                if (toolConfig.containsKey("type")) {
                    tool.put("id", toolConfig.get("type"));
                    tool.put("name", toolConfig.get("type"));
                } else {
                    log.warn("工具配置缺少标识符，跳过: {}", toolConfig);
                    continue;
                }
            }
            
            // 如果只有id没有name，使用id作为name
            if (tool.containsKey("id") && !tool.containsKey("name")) {
                tool.put("name", tool.get("id"));
            }
            // 如果只有name没有id，使用name作为id
            if (tool.containsKey("name") && !tool.containsKey("id")) {
                tool.put("id", tool.get("name"));
            }
            
            // 保留原始配置信息（用于调试）
            tool.put("config", toolConfig);
            
            formattedTools.add(tool);
            log.debug("格式化工具: id={}, name={}", tool.get("id"), tool.get("name"));
        }
        
        log.info("格式化后的工具列表数量: {}", formattedTools.size());
        return formattedTools;
    }
    
    @Override
    public Map<String, Object> chat(List<Map<String, Object>> messages, String appId) {
        return chat(messages, appId, null, null);
    }
    
    @Override
    public Map<String, Object> chat(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs) {
        return chat(messages, appId, customInputs, null);
    }
    
    @Override
    public Map<String, Object> chat(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs, String apiKey) {
        try {
            log.info("Dify对话, appId: {}, messages: {}", appId, messages != null ? messages.size() : 0);
            
            // 确定使用的 API Key：优先使用传入的 apiKey，其次使用全局配置
            final String usedApiKey = (apiKey != null && !apiKey.isEmpty()) ? apiKey : difyApiKey;
            
            // 检查认证配置
            if (usedApiKey == null || usedApiKey.isEmpty()) {
                String errorMsg = "Dify API Key 未配置。请检查 dify.api.key 配置或应用配置中的 key。";
                log.error(errorMsg);
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", true);
                errorResult.put("message", errorMsg);
                return errorResult;
            }
            
            // 如果提供了自定义输入参数，直接作为完整请求体使用（不做转换）
            Map<String, Object> finalRequestBody;
            String url;
            
            if (customInputs != null && !customInputs.isEmpty()) {
                // customInputs 已经是完整的请求体，直接使用
                finalRequestBody = new HashMap<>(customInputs);
                log.info("使用完整请求体（不做转换）: {}", customInputs);
                
                // 根据请求体中是否包含 query 来判断使用哪个 API
                if (finalRequestBody.containsKey("query")) {
                    url = difyApiUrl + "/v1/chat-messages";
                } else {
                    url = difyApiUrl + "/v1/completion-messages";
                }
            } else if (messages != null && !messages.isEmpty()) {
                // 从 messages 中提取 query，构建 chat-messages 请求体
                String query = extractLastUserMessage(messages);
                url = difyApiUrl + "/v1/chat-messages";
                finalRequestBody = new HashMap<>();
                finalRequestBody.put("inputs", new HashMap<>());
                finalRequestBody.put("query", query);
                finalRequestBody.put("response_mode", "blocking");
                finalRequestBody.put("user", UUID.randomUUID().toString());
                log.info("从消息构建请求体, query: {}", query);
            } else {
                // 默认使用 completion-messages
                url = difyApiUrl + "/v1/completion-messages";
                finalRequestBody = new HashMap<>();
                finalRequestBody.put("inputs", new HashMap<>());
                finalRequestBody.put("response_mode", "blocking");
                finalRequestBody.put("user", UUID.randomUUID().toString());
                log.info("使用默认 completion-messages 请求体");
            }
            
            // 确保必要的字段存在
            if (!finalRequestBody.containsKey("inputs")) {
                finalRequestBody.put("inputs", new HashMap<>());
            }
            if (!finalRequestBody.containsKey("response_mode")) {
                finalRequestBody.put("response_mode", "blocking");
            }
            if (!finalRequestBody.containsKey("user")) {
                finalRequestBody.put("user", UUID.randomUUID().toString());
            }
            
            log.info("调用 Dify API, URL: {}, requestBody: {}", url, finalRequestBody);
            
            // workflow API 的请求体需要包含 inputs, response_mode, user（都在请求体中，不在查询参数）
            if (url.contains("/v1/workflows/run")) {
                // 确保 workflow API 的请求体格式正确
                Map<String, Object> workflowBody = new HashMap<>();
                workflowBody.put("inputs", finalRequestBody.getOrDefault("inputs", new HashMap<>()));
                workflowBody.put("response_mode", finalRequestBody.getOrDefault("response_mode", "blocking"));
                workflowBody.put("user", finalRequestBody.getOrDefault("user", UUID.randomUUID().toString()));
                finalRequestBody = workflowBody;
                log.info("Workflow API 请求, URL: {}, requestBody: {}", url, finalRequestBody);
            }
            
            if (appId != null && !appId.isEmpty()) {
                Mono<Map> response = webClient.post()
                    .uri(url)
                    .headers(headers -> {
                        headers.setBearerAuth(usedApiKey);
                        log.debug("使用Bearer Token认证, API Key: {}...", usedApiKey.length() > 10 ? usedApiKey.substring(0, 10) + "..." : usedApiKey);
                    })
                    .bodyValue(finalRequestBody)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> {
                        return clientResponse.bodyToMono(String.class)
                            .flatMap(body -> {
                                String errorMsg = String.format("Dify API请求失败, 状态码: %s, 响应: %s", clientResponse.statusCode(), body);
                                log.error(errorMsg);
                                return Mono.error(new RuntimeException(errorMsg));
                            });
                    })
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(60));
                
                Map<String, Object> result = response.block();
                if (result != null) {
                    log.info("Dify API 调用成功, URL: {}", url);
                    return result;
                }
                return new HashMap<>();
            } else {
                // 如果没有应用ID，使用默认请求体
                if (finalRequestBody == null || finalRequestBody.isEmpty()) {
                    // 从 messages 中提取 query
                    if (messages != null && !messages.isEmpty()) {
                        String query = extractLastUserMessage(messages);
                        url = difyApiUrl + "/v1/chat-messages";
                        finalRequestBody = new HashMap<>();
                        finalRequestBody.put("inputs", new HashMap<>());
                        finalRequestBody.put("query", query);
                        finalRequestBody.put("response_mode", "blocking");
                        finalRequestBody.put("user", UUID.randomUUID().toString());
                    } else {
                        url = difyApiUrl + "/v1/completion-messages";
                        finalRequestBody = new HashMap<>();
                        finalRequestBody.put("inputs", new HashMap<>());
                        finalRequestBody.put("response_mode", "blocking");
                        finalRequestBody.put("user", UUID.randomUUID().toString());
                    }
                }
                
                log.info("调用 Dify API (无appId), URL: {}", url);
                Mono<Map> response = webClient.post()
                    .uri(url)
                    .headers(headers -> {
                        headers.setBearerAuth(usedApiKey);
                        log.debug("使用Bearer Token认证, API Key: {}...", usedApiKey.length() > 10 ? usedApiKey.substring(0, 10) + "..." : usedApiKey);
                    })
                    .bodyValue(finalRequestBody)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> {
                        return clientResponse.bodyToMono(String.class)
                            .flatMap(body -> {
                                String errorMsg = String.format("Dify API请求失败, 状态码: %s, 响应: %s", clientResponse.statusCode(), body);
                                log.error(errorMsg);
                                return Mono.error(new RuntimeException(errorMsg));
                            });
                    })
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(60));
                
                Map<String, Object> result = response.block();
                if (result != null) {
                    log.info("Dify API 调用成功");
                    return result;
                }
                return new HashMap<>();
            }
            
        } catch (Exception e) {
            log.error("Dify对话失败", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", true);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Flux<String> chatStream(List<Map<String, Object>> messages, String appId) {
        return chatStream(messages, appId, null, null);
    }
    
    @Override
    public Flux<String> chatStream(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs) {
        return chatStream(messages, appId, customInputs, null);
    }
    
    /**
     * 流式Dify对话（支持自定义输入参数和 API Key）
     * @param messages 消息列表
     * @param appId 应用ID
     * @param customInputs 自定义输入参数（如果为null，则从messages中提取query）
     * @param apiKey API Key（可选，如果为空则使用全局配置）
     * @return 流式响应
     */
    @Override
    public Flux<String> chatStream(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs, String apiKey) {
        try {
            log.info("流式Dify对话, appId: {}, messages: {}", appId, messages != null ? messages.size() : 0);
            
            // 确定使用的 API Key：优先使用传入的 apiKey，其次使用全局配置
            final String usedApiKey = (apiKey != null && !apiKey.isEmpty()) ? apiKey : difyApiKey;
            
            // 检查认证配置
            if (usedApiKey == null || usedApiKey.isEmpty()) {
                String errorMsg = "Dify API Key 未配置。请检查 dify.api.key 配置或应用配置中的 key。";
                log.error(errorMsg);
                try {
                    return Flux.just("data: " + objectMapper.writeValueAsString(
                        Map.of("error", true, "message", errorMsg)
                    ));
                } catch (Exception ex) {
                    return Flux.just("data: {\"error\":true,\"message\":\"" + errorMsg + "\"}");
                }
            }
            
            // 如果提供了自定义输入参数，直接作为完整请求体使用（不做转换）
            Map<String, Object> finalRequestBody;
            String url;
            
            if (customInputs != null && !customInputs.isEmpty()) {
                // customInputs 已经是完整的请求体，直接使用
                finalRequestBody = new HashMap<>(customInputs);
                log.info("使用完整请求体（不做转换）: {}", customInputs);
                
                // 首先检查应用类型是否为 workflow
                String apiType = determineApiType(appId, customInputs);
                if ("workflow".equals(apiType)) {
                    url = difyApiUrl + "/v1/workflows/run";
                } else if (finalRequestBody.containsKey("query")) {
                    // 如果请求体包含 query（顶级参数），使用 chat-messages
                    url = difyApiUrl + "/v1/chat-messages";
                } else {
                    // 否则使用 completion-messages
                    url = difyApiUrl + "/v1/completion-messages";
                }
            } else if (messages != null && !messages.isEmpty()) {
                // 从 messages 中提取 query，构建 chat-messages 请求体
                String query = extractLastUserMessage(messages);
                url = difyApiUrl + "/v1/chat-messages";
                finalRequestBody = new HashMap<>();
                finalRequestBody.put("inputs", new HashMap<>());
                finalRequestBody.put("query", query);
                finalRequestBody.put("response_mode", "streaming");
                finalRequestBody.put("user", UUID.randomUUID().toString());
                log.info("从消息构建请求体, query: {}", query);
            } else {
                // 默认使用 completion-messages
                url = difyApiUrl + "/v1/completion-messages";
                finalRequestBody = new HashMap<>();
                finalRequestBody.put("inputs", new HashMap<>());
                finalRequestBody.put("response_mode", "streaming");
                finalRequestBody.put("user", UUID.randomUUID().toString());
                log.info("使用默认 completion-messages 请求体");
            }
            
            // 确保必要的字段存在
            if (!finalRequestBody.containsKey("inputs")) {
                finalRequestBody.put("inputs", new HashMap<>());
            }
            if (!finalRequestBody.containsKey("response_mode")) {
                finalRequestBody.put("response_mode", "streaming");
            }
            if (!finalRequestBody.containsKey("user")) {
                finalRequestBody.put("user", UUID.randomUUID().toString());
            }
            
            log.info("调用 Dify API (流式), URL: {}, requestBody: {}", url, finalRequestBody);
            
            // workflow API 的请求体需要包含 inputs, response_mode, user（都在请求体中，不在查询参数）
            if (url.contains("/v1/workflows/run")) {
                // 确保 workflow API 的请求体格式正确
                Map<String, Object> workflowBody = new HashMap<>();
                workflowBody.put("inputs", finalRequestBody.getOrDefault("inputs", new HashMap<>()));
                workflowBody.put("response_mode", finalRequestBody.getOrDefault("response_mode", "streaming"));
                workflowBody.put("user", finalRequestBody.getOrDefault("user", UUID.randomUUID().toString()));
                finalRequestBody = workflowBody;
                log.info("Workflow API 请求 (流式), URL: {}, requestBody: {}", url, finalRequestBody);
            }
            
            return webClient.post()
                .uri(url)
                .headers(headers -> {
                    headers.setBearerAuth(usedApiKey);
                    headers.setAccept(Collections.singletonList(MediaType.TEXT_EVENT_STREAM));
                    log.debug("使用Bearer Token认证, API Key: {}...", usedApiKey.length() > 10 ? usedApiKey.substring(0, 10) + "..." : usedApiKey);
                })
                .bodyValue(finalRequestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .timeout(Duration.ofSeconds(300))
                .onErrorResume(reactor.netty.http.client.PrematureCloseException.class, e -> {
                    // PrematureCloseException 通常表示服务器正常关闭了流式连接（流式响应完成）
                    // 这是正常的，不应该作为错误处理
                    log.info("流式响应连接已关闭（正常完成）");
                    return Flux.empty();
                })
                .onErrorResume(e -> {
                    log.error("流式Dify对话失败", e);
                    try {
                        return Flux.just("data: " + objectMapper.writeValueAsString(
                            Map.of("error", true, "message", e.getMessage())
                        ));
                    } catch (Exception ex) {
                        return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage() + "\"}");
                    }
                });
            
        } catch (Exception e) {
            log.error("流式Dify对话失败", e);
            try {
                return Flux.just("data: " + objectMapper.writeValueAsString(
                    Map.of("error", true, "message", e.getMessage())
                ));
            } catch (Exception ex) {
                return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage() + "\"}");
            }
        }
    }
    
    @Override
    public Map<String, Object> executeWorkflow(String workflowId, Map<String, Object> inputs) {
        try {
            log.info("执行Dify工作流: {}, inputs: {}", workflowId, inputs);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", inputs);
            requestBody.put("response_mode", "blocking");
            requestBody.put("user", UUID.randomUUID().toString());
            
            String url = difyApiUrl + "/v1/workflows/run";
            Mono<Map> response = webClient.post()
                .uri(url)
                .headers(headers -> {
                    if (difyApiKey != null && !difyApiKey.isEmpty()) {
                        headers.setBearerAuth(difyApiKey);
                    } else if (difyUsername != null && !difyUsername.isEmpty()) {
                        String auth = Base64.getEncoder().encodeToString(
                            (difyUsername + ":" + difyPassword).getBytes()
                        );
                        headers.set("Authorization", "Basic " + auth);
                    }
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(120));
            
            Map<String, Object> result = response.block();
            return result != null ? result : new HashMap<>();
            
        } catch (Exception e) {
            log.error("执行Dify工作流失败", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", true);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Flux<String> executeWorkflowStream(String workflowId, Map<String, Object> inputs) {
        try {
            log.info("流式执行Dify工作流: {}, inputs: {}", workflowId, inputs);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", inputs);
            requestBody.put("response_mode", "streaming");
            requestBody.put("user", UUID.randomUUID().toString());
            
            String url = difyApiUrl + "/v1/workflows/run";
            return webClient.post()
                .uri(url)
                .headers(headers -> {
                    if (difyApiKey != null && !difyApiKey.isEmpty()) {
                        headers.setBearerAuth(difyApiKey);
                    } else if (difyUsername != null && !difyUsername.isEmpty()) {
                        String auth = Base64.getEncoder().encodeToString(
                            (difyUsername + ":" + difyPassword).getBytes()
                        );
                        headers.set("Authorization", "Basic " + auth);
                    }
                    headers.setAccept(Collections.singletonList(MediaType.TEXT_EVENT_STREAM));
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .timeout(Duration.ofSeconds(300))
                .onErrorResume(reactor.netty.http.client.PrematureCloseException.class, e -> {
                    // PrematureCloseException 通常表示服务器正常关闭了流式连接（流式响应完成）
                    // 这是正常的，不应该作为错误处理
                    log.info("流式响应连接已关闭（正常完成）");
                    return Flux.empty();
                })
                .onErrorResume(e -> {
                    log.error("流式执行Dify工作流失败", e);
                    try {
                        return Flux.just("data: " + objectMapper.writeValueAsString(
                            Map.of("error", true, "message", e.getMessage())
                        ));
                    } catch (Exception ex) {
                        return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage() + "\"}");
                    }
                });
            
        } catch (Exception e) {
            log.error("流式执行Dify工作流失败", e);
            try {
                return Flux.just("data: " + objectMapper.writeValueAsString(
                    Map.of("error", true, "message", e.getMessage())
                ));
            } catch (Exception ex) {
                return Flux.just("data: {\"error\":true,\"message\":\"" + e.getMessage() + "\"}");
            }
        }
    }
    
    /**
     * 从消息列表中提取最后一条用户消息
     */
    private String extractLastUserMessage(List<Map<String, Object>> messages) {
        if (messages == null || messages.isEmpty()) {
            return "";
        }
        
        for (int i = messages.size() - 1; i >= 0; i--) {
            Map<String, Object> message = messages.get(i);
            if ("user".equals(message.get("role"))) {
                Object content = message.get("content");
                return content != null ? content.toString() : "";
            }
        }
        
        return "";
    }
    
    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.sdecloud.springai.alibaba.service.DifyAppConfigService difyAppConfigService;
    
    /**
     * 根据应用ID和输入参数确定 API 类型
     * 优先从应用配置获取类型，如果配置为 workflow，直接返回 workflow
     * 如果 customInputs 包含 query（顶级参数），使用 chat-messages
     * 否则根据应用配置判断
     */
    private String determineApiType(String appId, Map<String, Object> customInputs) {
        // 优先从应用配置获取类型
        if (difyAppConfigService != null && appId != null && !appId.isEmpty()) {
            try {
                com.sdecloud.springai.alibaba.common.domain.DifyAppConfig config = 
                    difyAppConfigService.getByAppId(appId);
                if (config != null && config.getAppType() != null) {
                    // 如果配置为 workflow，直接返回
                    if ("workflow".equals(config.getAppType())) {
                        return "workflow";
                    }
                    // 如果配置为 chat，且请求体包含 query（顶级参数），返回 chat
                    if ("chat".equals(config.getAppType()) && 
                        customInputs != null && customInputs.containsKey("query")) {
                        return "chat";
                    }
                    // 如果配置为 completion，返回 completion
                    if ("completion".equals(config.getAppType())) {
                        return "completion";
                    }
                }
            } catch (Exception e) {
                log.debug("无法获取应用配置: {}", appId, e);
            }
        }
        
        // 如果输入参数包含 query（顶级参数），使用 chat-messages
        if (customInputs != null && customInputs.containsKey("query")) {
            return "chat";
        }
        
        // 默认使用 completion
        return "completion";
    }
    
    @Override
    public List<Map<String, Object>> getApps(Integer page, Integer limit, String name) {
        try {
            log.info("获取Dify应用列表, page: {}, limit: {}, name: {}", page, limit, name);
            
            // 构建请求URL
            StringBuilder urlBuilder = new StringBuilder(difyApiUrl + "/console/api/apps");
            urlBuilder.append("?page=").append(page != null ? page : 1);
            urlBuilder.append("&limit=").append(limit != null ? limit : 30);
            if (name != null && !name.isEmpty()) {
                urlBuilder.append("&name=").append(URLEncoder.encode(name, StandardCharsets.UTF_8));
            }
            
            String url = urlBuilder.toString();
            log.info("请求URL: {}", url);
            
            Mono<Map> response = webClient.get()
                .uri(url)
                .headers(headers -> {
                    if (difyApiKey != null && !difyApiKey.isEmpty()) {
                        headers.setBearerAuth(difyApiKey);
                    } else if (difyUsername != null && !difyUsername.isEmpty()) {
                        String auth = Base64.getEncoder().encodeToString(
                            (difyUsername + ":" + difyPassword).getBytes()
                        );
                        headers.set("Authorization", "Basic " + auth);
                    }
                })
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(30));
            
            Map<String, Object> result = response.block();
            log.info("应用列表响应: {}", result);
            
            if (result != null) {
                // 尝试从data字段获取应用列表
                if (result.containsKey("data")) {
                    Object dataObj = result.get("data");
                    if (dataObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> data = (Map<String, Object>) dataObj;
                        if (data.containsKey("data")) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> apps = (List<Map<String, Object>>) data.get("data");
                            if (apps != null) {
                                return apps;
                            }
                        }
                    } else if (dataObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> apps = (List<Map<String, Object>>) dataObj;
                        if (apps != null) {
                            return apps;
                        }
                    }
                }
                // 如果data字段不存在，尝试直接获取列表
                if (result instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> apps = (List<Map<String, Object>>) result;
                    if (apps != null) {
                        return apps;
                    }
                }
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("获取Dify应用列表失败", e);
            return new ArrayList<>();
        }
    }
}


