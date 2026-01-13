package com.sdecloud.springai.alibaba.common.tool;

import com.alibaba.cloud.ai.graph.RunnableConfig;
import org.springframework.ai.chat.model.ToolContext;

import java.util.Optional;
import java.util.function.BiFunction;

/**
 * 用户位置工具 - 使用上下文获取用户信息
 */
public class UserLocationTool implements BiFunction<UserLocationInput, ToolContext, String> {
    
    private static final String AGENT_CONFIG_CONTEXT_KEY = "agent_config";
    
    @Override
    public String apply(UserLocationInput input, ToolContext toolContext) {
        // 从上下文中获取用户信息
        String userId = "1";
        if (toolContext != null && toolContext.getContext() != null) {
            Object configObj = toolContext.getContext().get(AGENT_CONFIG_CONTEXT_KEY);
            if (configObj instanceof RunnableConfig) {
                RunnableConfig runnableConfig = (RunnableConfig) configObj;
                Optional<Object> userIdObjOptional = runnableConfig.metadata("user_id");
                if (userIdObjOptional.isPresent()) {
                    userId = (String) userIdObjOptional.get();
                }
            }
        }
        
        // 根据用户ID返回位置（这里使用模拟数据）
        return "1".equals(userId) ? "北京" : "上海";
    }
}

