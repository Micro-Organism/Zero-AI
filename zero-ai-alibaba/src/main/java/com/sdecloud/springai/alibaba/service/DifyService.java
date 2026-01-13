package com.sdecloud.springai.alibaba.service;

import java.util.List;
import java.util.Map;

/**
 * Dify服务接口
 * 用于调用Dify API，包括工具调用、对话等功能
 */
public interface DifyService {
    
    /**
     * 调用Dify工具
     * 
     * @param toolName 工具名称
     * @param parameters 工具参数
     * @return 工具执行结果
     */
    Map<String, Object> callTool(String toolName, Map<String, Object> parameters);
    
    /**
     * 流式调用Dify工具
     * 
     * @param toolName 工具名称
     * @param parameters 工具参数
     * @return 流式响应
     */
    reactor.core.publisher.Flux<String> callToolStream(String toolName, Map<String, Object> parameters);
    
    /**
     * 获取Dify应用的工具列表
     * 
     * @param appId 应用ID（可选）
     * @return 工具列表
     */
    List<Map<String, Object>> getTools(String appId);
    
    /**
     * Dify对话接口
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @return 对话响应
     */
    Map<String, Object> chat(List<Map<String, Object>> messages, String appId);
    
    /**
     * Dify对话接口（支持自定义输入参数）
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @param customInputs 自定义输入参数（可选）
     * @return 对话响应
     */
    Map<String, Object> chat(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs);
    
    /**
     * Dify对话接口（支持自定义输入参数和 API Key）
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @param customInputs 自定义输入参数（可选）
     * @param apiKey API Key（可选，如果为空则使用全局配置）
     * @return 对话响应
     */
    Map<String, Object> chat(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs, String apiKey);
    
    /**
     * 流式Dify对话接口
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @return 流式响应
     */
    reactor.core.publisher.Flux<String> chatStream(List<Map<String, Object>> messages, String appId);
    
    /**
     * 流式Dify对话接口（支持自定义输入参数）
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @param customInputs 自定义输入参数（可选）
     * @return 流式响应
     */
    reactor.core.publisher.Flux<String> chatStream(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs);
    
    /**
     * 流式Dify对话接口（支持自定义输入参数和 API Key）
     * 
     * @param messages 对话消息列表
     * @param appId 应用ID（可选）
     * @param customInputs 自定义输入参数（可选）
     * @param apiKey API Key（可选，如果为空则使用全局配置）
     * @return 流式响应
     */
    reactor.core.publisher.Flux<String> chatStream(List<Map<String, Object>> messages, String appId, Map<String, Object> customInputs, String apiKey);
    
    /**
     * 执行Dify工作流
     * 
     * @param workflowId 工作流ID
     * @param inputs 输入参数
     * @return 执行结果
     */
    Map<String, Object> executeWorkflow(String workflowId, Map<String, Object> inputs);
    
    /**
     * 流式执行Dify工作流
     * 
     * @param workflowId 工作流ID
     * @param inputs 输入参数
     * @return 流式响应
     */
    reactor.core.publisher.Flux<String> executeWorkflowStream(String workflowId, Map<String, Object> inputs);
    
    /**
     * 获取Dify应用列表
     * 
     * @param page 页码（从1开始）
     * @param limit 每页数量
     * @param name 应用名称（可选，用于搜索）
     * @return 应用列表
     */
    List<Map<String, Object>> getApps(Integer page, Integer limit, String name);
}

