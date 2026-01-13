package com.sdecloud.springai.alibaba.common.config;

import com.alibaba.cloud.ai.graph.agent.AgentTool;
import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.alibaba.cloud.ai.graph.agent.flow.agent.SequentialAgent;
import com.alibaba.cloud.ai.graph.agent.flow.agent.SupervisorAgent;
import com.sdecloud.springai.alibaba.common.model.AnalysisResponse;
import com.sdecloud.springai.alibaba.common.model.LocationResponse;
import com.sdecloud.springai.alibaba.common.model.WeatherResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 多智能体配置类
 * 实现三种多智能体模式：SupervisorAgent、SequentialAgent、AgentTool
 */
@Configuration
public class MultiAgentConfig {

    // ==================== 模式1：SupervisorAgent（监督者模式） ====================

    /**
     * 创建专业 Agent 1：天气查询专家
     */
    @Bean(name = "weatherAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent weatherAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("getUserLocationTool") ToolCallback getUserLocationTool,
            @Qualifier("getWeatherTool") ToolCallback getWeatherTool) {
        return ReactAgent.builder()
                .name("weather_agent")
                .model(chatModel)
                .description("专业的天气查询专家，擅长查询和提供天气信息")
                .instruction("你是一个专业的天气查询专家。当用户询问天气时，你需要先获取位置信息，然后查询该位置的天气，并提供详细的天气信息和建议。")
                .tools(getUserLocationTool, getWeatherTool)
                .outputType(WeatherResponse.class)
                .outputKey("weather_output")
                .build();
    }

    /**
     * 创建专业 Agent 2：位置服务专家
     */
    @Bean(name = "locationAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent locationAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("getUserLocationTool") ToolCallback getUserLocationTool) {
        return ReactAgent.builder()
                .name("location_agent")
                .model(chatModel)
                .description("专业的位置服务专家，擅长获取和处理位置信息")
                .instruction("你是一个专业的位置服务专家。当用户询问位置、地址或地理信息时，你需要使用工具获取位置信息，并提供详细的位置数据。")
                .tools(getUserLocationTool)
                .outputType(LocationResponse.class)
                .outputKey("location_output")
                .build();
    }

    /**
     * 创建专业 Agent 3：数据分析专家
     */
    @Bean(name = "analysisAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent analysisAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel) {
        return ReactAgent.builder()
                .name("analysis_agent")
                .model(chatModel)
                .description("专业的数据分析专家，擅长分析和处理数据")
                .instruction("你是一个专业的数据分析专家。当用户需要数据分析、统计或报告时，你需要分析提供的数据，生成统计信息、关键点和结论。")
                .outputType(AnalysisResponse.class)
                .outputKey("analysis_output")
                .build();
    }

    /**
     * 创建监督者 Agent（SupervisorAgent 模式）
     */
    @Bean(name = "supervisorAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public SupervisorAgent supervisorAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("weatherAgent") ReactAgent weatherAgent,
            @Qualifier("locationAgent") ReactAgent locationAgent,
            @Qualifier("analysisAgent") ReactAgent analysisAgent) {

        String supervisorPrompt = """
                你是一个智能任务协调者，负责将用户请求路由到合适的专业Agent。
                
                ## 可用的子Agent
                
                ### weather_agent
                - **功能**：查询天气信息
                - **适用场景**：用户询问天气、温度、降雨、湿度、风速等天气相关问题
                - **输出**：weather_output
                
                ### location_agent
                - **功能**：获取和处理位置信息
                - **适用场景**：用户询问位置、地址、城市、地理信息等位置相关问题
                - **输出**：location_output
                
                ### analysis_agent
                - **功能**：数据分析和处理
                - **适用场景**：用户需要数据分析、统计、报告、总结等分析类任务
                - **输出**：analysis_output
                
                ## 决策规则
                1. 仔细分析用户请求，判断任务类型
                2. 选择最合适的Agent处理任务
                3. 如果任务完成，返回 FINISH
                4. 如果任务需要多个步骤，可以依次调用多个Agent
                
                ## 响应格式
                只返回Agent名称（weather_agent、location_agent、analysis_agent）或FINISH，不要包含其他解释。
                """;

        return SupervisorAgent.builder()
                .name("supervisor")
                .description("智能任务协调者，负责路由用户请求到合适的专业Agent")
                .model(chatModel)
                .systemPrompt(supervisorPrompt)
                .subAgents(List.of(weatherAgent, locationAgent, analysisAgent))
                .build();
    }

    // ==================== 模式2：SequentialAgent（顺序执行模式） ====================

    /**
     * 创建步骤1 Agent：位置获取
     */
    @Bean(name = "step1LocationAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent step1LocationAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("getUserLocationTool") ToolCallback getUserLocationTool) {
        return ReactAgent.builder()
                .name("step1_location_agent")
                .model(chatModel)
                .description("第一步：获取用户位置")
                .instruction("你的任务是获取用户的位置信息。根据用户ID或查询内容，使用工具获取位置，并返回位置信息。")
                .tools(getUserLocationTool)
                .outputType(LocationResponse.class)
                .outputKey("location")
                .build();
    }

    /**
     * 创建步骤2 Agent：天气查询（使用步骤1的位置信息）
     */
    @Bean(name = "step2WeatherAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent step2WeatherAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("getWeatherTool") ToolCallback getWeatherTool) {
        return ReactAgent.builder()
                .name("step2_weather_agent")
                .model(chatModel)
                .description("第二步：查询位置对应的天气")
                .instruction("你的任务是查询指定位置的天气信息。位置信息来自前一步的输出：{location}。使用天气查询工具获取该位置的天气，并提供详细的天气信息。")
                .tools(getWeatherTool)
                .outputType(WeatherResponse.class)
                .outputKey("weather")
                .build();
    }

    /**
     * 创建步骤3 Agent：数据分析（使用步骤2的天气信息）
     */
    @Bean(name = "step3AnalysisAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent step3AnalysisAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel) {
        return ReactAgent.builder()
                .name("step3_analysis_agent")
                .model(chatModel)
                .description("第三步：分析天气数据")
                .instruction("你的任务是对天气数据进行分析。天气信息来自前一步的输出：{weather}。请分析天气数据，提取关键信息，生成统计数据和结论。")
                .outputType(AnalysisResponse.class)
                .outputKey("analysis")
                .build();
    }

    /**
     * 创建顺序执行 Agent（SequentialAgent 模式）
     */
    @Bean(name = "sequentialAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public SequentialAgent sequentialAgent(
            @Qualifier("step1LocationAgent") ReactAgent step1Agent,
            @Qualifier("step2WeatherAgent") ReactAgent step2Agent,
            @Qualifier("step3AnalysisAgent") ReactAgent step3Agent) {
        return SequentialAgent.builder()
                .name("sequential_workflow_agent")
                .description("顺序工作流：先获取位置，再查询天气，最后分析数据")
                .subAgents(List.of(step1Agent, step2Agent, step3Agent))
                .build();
    }

    // ==================== 模式3：AgentTool（Agent 作为工具） ====================

    /**
     * 创建协调者 Agent（AgentTool 模式）
     * 将其他 Agent 封装成工具供调用
     */
    @Bean(name = "coordinatorAgent")
    @ConditionalOnBean(name = "deepSeekChatModel")
    public ReactAgent coordinatorAgent(
            @Qualifier("deepSeekChatModel") ChatModel chatModel,
            @Qualifier("weatherAgent") ReactAgent weatherAgent,
            @Qualifier("locationAgent") ReactAgent locationAgent,
            @Qualifier("analysisAgent") ReactAgent analysisAgent) {

        // 将其他 Agent 封装成工具
        ToolCallback weatherTool = AgentTool.getFunctionToolCallback(weatherAgent);
        ToolCallback locationTool = AgentTool.getFunctionToolCallback(locationAgent);
        ToolCallback analysisTool = AgentTool.getFunctionToolCallback(analysisAgent);

        return ReactAgent.builder()
                .name("coordinator_agent")
                .model(chatModel)
                .description("协调者 Agent，可以调用天气、位置和分析工具")
                .instruction("""
                        你是一个智能协调者，可以根据用户需求调用不同的工具来完成任务。
                        
                        可用的工具：
                        - weather_agent：查询天气信息
                        - location_agent：获取位置信息
                        - analysis_agent：进行数据分析
                        
                        根据用户的需求，选择合适的工具调用，可以调用多个工具来完成复杂任务。
                        """)
                .tools(weatherTool, locationTool, analysisTool)
                .outputType(com.sdecloud.springai.alibaba.common.model.ResponseFormat.class)
                .build();
    }
}

