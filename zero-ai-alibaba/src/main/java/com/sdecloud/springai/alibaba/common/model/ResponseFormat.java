package com.sdecloud.springai.alibaba.common.model;

import lombok.Data;
import java.util.List;

/**
 * Agent 响应格式
 * 支持多种数据类型的结构化输出
 */
@Data
public class ResponseFormat {

    /**
     * 双关语响应（始终必需）
     */
    private String punnyResponse;

    /**
     * 如果可用的话，关于天气的任何有趣信息
     */
    private String weatherConditions;

    /**
     * 温度信息（字符串类型）
     */
    private String temperature;

    /**
     * 湿度信息（字符串类型）
     */
    private String humidity;

    /**
     * 风速（整数类型）
     */
    private Integer windSpeed;

    /**
     * 风向（字符串类型）
     */
    private String windDirection;

    /**
     * 建议列表（列表类型）
     */
    private List<String> suggestions;

    /**
     * 是否晴天（布尔类型）
     */
    private Boolean isSunny;

    /**
     * 能见度（浮点数类型）
     */
    private Double visibility;

    /**
     * 天气详情（嵌套对象类型）
     */
    private WeatherDetail detail;

    /**
     * 天气详情嵌套类
     */
    @Data
    public static class WeatherDetail {
        /**
         * 当前天气状况
         */
        private String currentCondition;

        /**
         * 天气预报
         */
        private String forecast;

        /**
         * 能见度（整数）
         */
        private Integer visibility;

        /**
         * 空气质量指数
         */
        private Integer airQualityIndex;

        /**
         * 紫外线指数
         */
        private Integer uvIndex;
    }
}

