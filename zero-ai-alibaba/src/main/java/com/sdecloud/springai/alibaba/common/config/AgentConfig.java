package com.sdecloud.springai.alibaba.common.config;

import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.sdecloud.springai.alibaba.common.tool.UserLocationInput;
import com.sdecloud.springai.alibaba.common.tool.WeatherForLocationInput;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import com.sdecloud.springai.alibaba.common.model.ResponseFormat;
import com.sdecloud.springai.alibaba.common.tool.UserLocationTool;
import com.sdecloud.springai.alibaba.common.tool.WeatherForLocationTool;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Agent 配置类
 * 支持多种模型的 Agent 配置
 */
@Configuration
public class AgentConfig {

    /**
     * 系统提示词
     */
    private static final String SYSTEM_PROMPT = """
            你是一位专业的天气预报专家，说话时喜欢使用双关语。

            你可以使用两个工具：

            - getWeatherForLocation: 使用此工具获取特定位置的天气
            - getUserLocation: 使用此工具获取用户的位置

            如果用户询问天气，请确保你知道位置。
            如果你能从问题中判断出他们指的是他们所在的位置，
            请使用 getUserLocation 工具来查找他们的位置。
            """;

    /**
     * 创建天气查询工具
     */
    @Bean
    public ToolCallback getWeatherTool() {
        return FunctionToolCallback.builder("getWeatherForLocation", new WeatherForLocationTool())
                .description("获取指定城市的天气信息")
                .inputType(WeatherForLocationInput.class)
                .build();
    }

    /**
     * 创建用户位置工具
     */
    @Bean
    public ToolCallback getUserLocationTool() {
        return FunctionToolCallback.builder("getUserLocation", new UserLocationTool())
                .description("根据用户ID获取用户位置")
                .inputType(UserLocationInput.class)
                .build();
    }

    /**
     * 创建基于 Qwen 的天气预报 Agent
     * 只有当 qwenChatModel Bean 存在时才会创建
     */
    @Bean(name = "qwenWeatherAgent")
    @ConditionalOnBean(name = "qwenChatModel")
    public ReactAgent qwenWeatherAgent(
            @Qualifier("qwenChatModel") ChatModel qwenChatModel,
            ToolCallback getWeatherTool,
            ToolCallback getUserLocationTool) {
        return ReactAgent.builder()
                .name("qwen_weather_agent")
                .model(qwenChatModel)
                .systemPrompt(SYSTEM_PROMPT)
                .tools(getUserLocationTool, getWeatherTool)
                .outputType(ResponseFormat.class)
                .build();
    }

    /**
     * 创建基于 DeepSeek 的天气预报 Agent
     * 只有当 deepSeekChatModel Bean 存在时才会创建
     */
    @Bean(name = "deepSeekWeatherAgent")
//    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent deepSeekWeatherAgent(
            @Qualifier("deepSeekChatModel") ChatModel deepSeekChatModel,
            ToolCallback getWeatherTool,
            ToolCallback getUserLocationTool) {
        return ReactAgent.builder()
                .name("deepseek_weather_agent")
                .model(deepSeekChatModel)
                .systemPrompt(SYSTEM_PROMPT)
                .tools(getUserLocationTool, getWeatherTool)
                .outputType(ResponseFormat.class)
                .build();
    }
}

