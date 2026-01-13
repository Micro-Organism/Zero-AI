package com.sdecloud.springai.alibaba.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Dify 工具配置
 * 从 application-dev.yml 读取配置
 */
@Component
@ConfigurationProperties(prefix = "dify.api.tools")
@Data
public class DifyToolsConfig {
    
    /**
     * 工具配置映射
     */
    private AppConfig app1;
    private AppConfig app2;
    private AppConfig app3;
    private AppConfig app4;
    private AppConfig app5;
    
    /**
     * 获取所有应用配置
     */
    public Map<String, AppConfig> getAllApps() {
        Map<String, AppConfig> allApps = new HashMap<>();
        if (app1 != null) allApps.put("app1", app1);
        if (app2 != null) allApps.put("app2", app2);
        if (app3 != null) allApps.put("app3", app3);
        if (app4 != null) allApps.put("app4", app4);
        if (app5 != null) allApps.put("app5", app5);
        return allApps;
    }
    
    @Data
    public static class AppConfig {
        private String name;
        private String appid;
        private String key;
        private String description;
    }
}

