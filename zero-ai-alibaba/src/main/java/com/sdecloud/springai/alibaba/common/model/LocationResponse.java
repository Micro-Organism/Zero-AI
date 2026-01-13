package com.sdecloud.springai.alibaba.common.model;

import lombok.Data;

/**
 * 位置服务 Agent 响应格式
 */
@Data
public class LocationResponse {
    private String city;
    private String province;
    private String country;
    private Double latitude;
    private Double longitude;
    private String address;
    private Boolean isResolved;
}

