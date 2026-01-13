package com.sdecloud.springai.alibaba.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdecloud.springai.alibaba.service.DifyService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

/**
 * Dify API控制器
 * 提供Dify工具调用、对话、工作流等功能
 */
@RestController
@RequestMapping("/api/dify")
@Slf4j
public class DifyController {
    
    @Autowired
    private DifyService difyService;
    
    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.sdecloud.springai.alibaba.service.DifyAppConfigService difyAppConfigService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * 获取应用列表
     * 用于获取 Dify 工作空间中的所有应用
     */
    @GetMapping("/apps")
    public Map<String, Object> getApps(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "30") Integer limit,
            @RequestParam(required = false) String name) {
        try {
            List<Map<String, Object>> apps = difyService.getApps(page, limit, name);
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("code", 200);
            result.put("message", "获取应用列表成功");
            result.put("data", apps);
            result.put("page", page);
            result.put("limit", limit);
            result.put("total", apps.size());
            return result;
        } catch (Exception e) {
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("code", 500);
            result.put("message", "获取应用列表失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 获取工具列表
     * 注意：Dify 没有全局工具列表接口，必须提供 appId 才能获取应用的工具列表
     */
    @GetMapping("/tools")
    public Map<String, Object> getTools(@RequestParam(required = false, value = "app_id") String appId) {
        try {
            log.info("接收到的 appId 参数: {}", appId);
            if (appId == null || appId.isEmpty()) {
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("code", 400);
                result.put("message", "获取工具列表需要提供 appId 参数。Dify 没有全局工具列表接口，工具信息是应用级别的。");
                result.put("data", null);
                return result;
            }
            
            List<Map<String, Object>> tools = difyService.getTools(appId);
            
            if (tools.isEmpty()) {
                return Map.of(
                    "code", 200,
                    "message", "该应用暂无工具配置，请检查应用ID是否正确",
                    "data", tools
                );
            }
            
            return Map.of(
                "code", 200,
                "message", "获取工具列表成功",
                "data", tools
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            // 配置错误，返回明确的错误信息
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("code", 400);
            result.put("message", e.getMessage());
            result.put("data", null);
            return result;
        } catch (RuntimeException e) {
            // 其他运行时错误（如认证失败、API调用失败等）
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("code", 500);
            result.put("message", e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 调用工具（同步）
     */
    @PostMapping("/tools/invoke")
    public Map<String, Object> invokeTool(@RequestBody Map<String, Object> request) {
        String toolName = (String) request.get("tool_name");
        @SuppressWarnings("unchecked")
        Map<String, Object> parameters = (Map<String, Object>) request.get("parameters");
        
        if (toolName == null || toolName.isEmpty()) {
            return Map.of(
                "code", 400,
                "message", "工具名称不能为空",
                "data", null
            );
        }
        
        Map<String, Object> result = difyService.callTool(
            toolName,
            parameters != null ? parameters : Map.of()
        );
        
        return Map.of(
            "code", result.containsKey("error") && (Boolean) result.get("error") ? 500 : 200,
            "message", result.containsKey("error") && (Boolean) result.get("error") 
                ? "工具调用失败: " + result.get("message")
                : "工具调用成功",
            "data", result
        );
    }
    
    /**
     * 调用工具（流式）
     */
    @PostMapping(value = "/tools/invoke/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> invokeToolStream(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        
        String toolName = (String) request.get("tool_name");
        @SuppressWarnings("unchecked")
        Map<String, Object> parameters = (Map<String, Object>) request.get("parameters");
        
        if (toolName == null || toolName.isEmpty()) {
            return Flux.just("data: " + Map.of(
                "error", true,
                "message", "工具名称不能为空"
            ));
        }
        
        return difyService.callToolStream(
            toolName,
            parameters != null ? parameters : Map.of()
        );
    }
    
    /**
     * Dify对话（同步）
     * 支持自定义输入参数，如果请求中包含 inputs，将直接使用；否则从 messages 中提取 query
     */
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        String appId = (String) request.get("app_id");
        @SuppressWarnings("unchecked")
        Map<String, Object> customInputs = (Map<String, Object>) request.get("inputs");
        
        // 如果提供了自定义输入参数，直接使用；否则需要 messages
        if (customInputs == null || customInputs.isEmpty()) {
            if (messages == null || messages.isEmpty()) {
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("code", 400);
                result.put("message", "消息列表不能为空，或者需要提供 inputs 参数");
                result.put("data", null);
                return result;
            }
        }
        
        Map<String, Object> result;
        try {
            // 获取应用的 API Key（如果应用配置服务可用）
            String appApiKey = null;
            if (difyAppConfigService != null && appId != null && !appId.isEmpty()) {
                try {
                    com.sdecloud.springai.alibaba.common.domain.DifyAppConfig config = 
                        difyAppConfigService.getByAppId(appId);
                    if (config != null) {
                        appApiKey = config.getApiKey();
                    }
                } catch (Exception e) {
                    log.debug("无法获取应用配置: {}", appId, e);
                }
            }
            
            // 如果提供了自定义输入参数，使用重载方法
            if (customInputs != null && !customInputs.isEmpty()) {
                result = difyService.chat(
                    messages != null ? messages : new java.util.ArrayList<>(), 
                    appId, 
                    customInputs,
                    appApiKey
                );
            } else {
                result = difyService.chat(messages, appId, null, appApiKey);
            }
        } catch (Exception e) {
            log.error("Dify对话调用失败", e);
            Map<String, Object> errorResult = new java.util.HashMap<>();
            errorResult.put("code", 500);
            errorResult.put("message", "对话失败: " + e.getMessage());
            errorResult.put("data", null);
            return errorResult;
        }
        
        return Map.of(
            "code", result.containsKey("error") && (Boolean) result.get("error") ? 500 : 200,
            "message", result.containsKey("error") && (Boolean) result.get("error")
                ? "对话失败: " + result.get("message")
                : "对话成功",
            "data", result
        );
    }
    
    /**
     * Dify对话（流式）
     * 支持自定义输入参数，如果请求中包含 inputs，将直接使用；否则从 messages 中提取 query
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        String appId = (String) request.get("app_id");
        @SuppressWarnings("unchecked")
        Map<String, Object> customInputs = (Map<String, Object>) request.get("inputs");
        
        // 如果提供了自定义输入参数，直接使用；否则需要 messages
        if (customInputs == null || customInputs.isEmpty()) {
            if (messages == null || messages.isEmpty()) {
                try {
                    return Flux.just("data: " + objectMapper.writeValueAsString(
                        Map.of("error", true, "message", "消息列表不能为空，或者需要提供 inputs 参数")
                    ));
                } catch (Exception e) {
                    return Flux.just("data: {\"error\":true,\"message\":\"消息列表不能为空，或者需要提供 inputs 参数\"}");
                }
            }
        }
        
        // 获取应用的 API Key（如果应用配置服务可用）
        String appApiKey = null;
        if (difyAppConfigService != null && appId != null && !appId.isEmpty()) {
            try {
                com.sdecloud.springai.alibaba.common.domain.DifyAppConfig config = 
                    difyAppConfigService.getByAppId(appId);
                if (config != null) {
                    appApiKey = config.getApiKey();
                }
            } catch (Exception e) {
                log.debug("无法获取应用配置: {}", appId, e);
            }
        }
        
        // 如果提供了自定义输入参数，使用重载方法
        if (customInputs != null && !customInputs.isEmpty()) {
            return difyService.chatStream(
                messages != null ? messages : new java.util.ArrayList<>(), 
                appId, 
                customInputs,
                appApiKey
            );
        }
        
        return difyService.chatStream(messages, appId, null, appApiKey);
    }
    
    /**
     * 执行工作流（同步）
     */
    @PostMapping("/workflows/execute")
    public Map<String, Object> executeWorkflow(@RequestBody Map<String, Object> request) {
        String workflowId = (String) request.get("workflow_id");
        @SuppressWarnings("unchecked")
        Map<String, Object> inputs = (Map<String, Object>) request.get("inputs");
        
        if (workflowId == null || workflowId.isEmpty()) {
            return Map.of(
                "code", 400,
                "message", "工作流ID不能为空",
                "data", null
            );
        }
        
        Map<String, Object> result = difyService.executeWorkflow(
            workflowId,
            inputs != null ? inputs : Map.of()
        );
        
        return Map.of(
            "code", result.containsKey("error") && (Boolean) result.get("error") ? 500 : 200,
            "message", result.containsKey("error") && (Boolean) result.get("error")
                ? "工作流执行失败: " + result.get("message")
                : "工作流执行成功",
            "data", result
        );
    }
    
    /**
     * 执行工作流（流式）
     */
    @PostMapping(value = "/workflows/execute/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> executeWorkflowStream(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        
        String workflowId = (String) request.get("workflow_id");
        @SuppressWarnings("unchecked")
        Map<String, Object> inputs = (Map<String, Object>) request.get("inputs");
        
        if (workflowId == null || workflowId.isEmpty()) {
            return Flux.just("data: " + Map.of(
                "error", true,
                "message", "工作流ID不能为空"
            ));
        }
        
        return difyService.executeWorkflowStream(
            workflowId,
            inputs != null ? inputs : Map.of()
        );
    }
    
    /**
     * Dify Completion Messages（同步）
     * 直接调用 V1 API completion-messages，默认使用 meeting_content 参数
     * 这是根据 shell 脚本成功示例创建的接口
     */
    @PostMapping("/completion")
    public Map<String, Object> completion(@RequestBody Map<String, Object> request) {
        String appId = (String) request.get("app_id");
        
        // 移除 app_id，其余参数直接作为请求体传递给 Dify API
        Map<String, Object> requestBody = new java.util.HashMap<>(request);
        requestBody.remove("app_id");
        
        // 默认 appId
        if (appId == null || appId.isEmpty()) {
            appId = "c46e6278-529e-4baf-9689-82e36f71ccfd";
        }
        
        // 确保必要的字段存在
        if (!requestBody.containsKey("response_mode")) {
            requestBody.put("response_mode", "blocking");
        }
        if (!requestBody.containsKey("user")) {
            requestBody.put("user", "test-user-" + System.currentTimeMillis());
        }
        if (!requestBody.containsKey("inputs")) {
            requestBody.put("inputs", new java.util.HashMap<>());
        }
        
        log.info("调用 Dify API, appId: {}, 请求体: {}", appId, requestBody);
        
        try {
            // 获取应用的 API Key（如果应用配置服务可用）
            String appApiKey = null;
            if (difyAppConfigService != null && appId != null && !appId.isEmpty()) {
                try {
                    com.sdecloud.springai.alibaba.common.domain.DifyAppConfig config = 
                        difyAppConfigService.getByAppId(appId);
                    if (config != null) {
                        appApiKey = config.getApiKey();
                    }
                } catch (Exception e) {
                    log.debug("无法获取应用配置: {}", appId, e);
                }
            }
            
            Map<String, Object> result;
            if ("streaming".equals(requestBody.get("response_mode"))) {
                // 流式模式需要特殊处理，这里先返回错误提示
                Map<String, Object> errorResult = new java.util.HashMap<>();
                errorResult.put("code", 400);
                errorResult.put("message", "流式模式请使用 /api/dify/completion/stream 接口");
                errorResult.put("data", null);
                return errorResult;
            } else {
                // 直接使用请求体，不做转换
                result = difyService.chat(
                    new java.util.ArrayList<>(), 
                    appId, 
                    requestBody,
                    appApiKey
                );
            }
            
            return Map.of(
                "code", result.containsKey("error") && (Boolean) result.get("error") ? 500 : 200,
                "message", result.containsKey("error") && (Boolean) result.get("error")
                    ? "调用失败: " + result.get("message")
                    : "调用成功",
                "data", result
            );
        } catch (Exception e) {
            log.error("Dify Completion Messages 调用失败", e);
            Map<String, Object> errorResult = new java.util.HashMap<>();
            errorResult.put("code", 500);
            errorResult.put("message", "调用失败: " + e.getMessage());
            errorResult.put("data", null);
            return errorResult;
        }
    }
    
    /**
     * Dify Completion Messages（流式）
     * 直接调用 V1 API completion-messages，默认使用 meeting_content 参数
     */
    @PostMapping(value = "/completion/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> completionStream(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        
        String appId = (String) request.get("app_id");
        
        // 移除 app_id，其余参数直接作为请求体传递给 Dify API
        Map<String, Object> requestBody = new java.util.HashMap<>(request);
        requestBody.remove("app_id");
        
        // 默认 appId
        if (appId == null || appId.isEmpty()) {
            appId = "c46e6278-529e-4baf-9689-82e36f71ccfd";
        }
        
        // 确保必要的字段存在
        if (!requestBody.containsKey("response_mode")) {
            requestBody.put("response_mode", "streaming");
        }
        if (!requestBody.containsKey("user")) {
            requestBody.put("user", "test-user-" + System.currentTimeMillis());
        }
        if (!requestBody.containsKey("inputs")) {
            requestBody.put("inputs", new java.util.HashMap<>());
        }
        
        log.info("调用 Dify API (流式), appId: {}, 请求体: {}", appId, requestBody);
        
        // 获取应用的 API Key（如果应用配置服务可用）
        String appApiKey = null;
        if (difyAppConfigService != null && appId != null && !appId.isEmpty()) {
            try {
                com.sdecloud.springai.alibaba.common.domain.DifyAppConfig config = 
                    difyAppConfigService.getByAppId(appId);
                if (config != null) {
                    appApiKey = config.getApiKey();
                }
            } catch (Exception e) {
                log.debug("无法获取应用配置: {}", appId, e);
            }
        }
        
        // 直接使用请求体，不做转换
        return difyService.chatStream(
            new java.util.ArrayList<>(), 
            appId, 
            requestBody,
            appApiKey
        );
    }
}

