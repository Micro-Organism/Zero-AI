package com.sdecloud.springai.alibaba.common.tool;

import org.springframework.ai.tool.annotation.ToolParam;

/**
 * 天气查询工具输入参数
 */
public record WeatherForLocationInput(@ToolParam(description = "城市名称") String city) {

}

