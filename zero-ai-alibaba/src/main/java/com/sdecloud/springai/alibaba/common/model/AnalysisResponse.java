package com.sdecloud.springai.alibaba.common.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 数据分析 Agent 响应格式
 */
@Data
public class AnalysisResponse {
    private String summary;
    private List<String> keyPoints;
    private Map<String, Object> statistics;
    private Integer dataCount;
    private Boolean hasAnomalies;
    private Double averageValue;
    private String conclusion;
}

