package com.sdecloud.springai.alibaba.common.model;

import lombok.Data;
import java.util.List;

/**
 * 天气查询 Agent 响应格式
 */
@Data
public class WeatherResponse {
    private String location;
    private String condition;
    private String temperature;
    private String humidity;
    private Integer windSpeed;
    private String windDirection;
    private List<String> suggestions;
    private Boolean isSunny;
    private Double visibility;
}

