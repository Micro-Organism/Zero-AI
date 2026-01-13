package com.sdecloud.springai.alibaba.common.tool;

import org.springframework.ai.chat.model.ToolContext;

import java.util.function.BiFunction;

/**
 * 天气查询工具
 */
public class WeatherForLocationTool implements BiFunction<WeatherForLocationInput, ToolContext, String> {
    
    @Override
    public String apply(WeatherForLocationInput input, ToolContext toolContext) {
        // 这里可以集成真实的天气API，目前返回模拟数据
        return input.city() + " 的天气：晴天，温度 25°C，湿度 60%";
    }
}

