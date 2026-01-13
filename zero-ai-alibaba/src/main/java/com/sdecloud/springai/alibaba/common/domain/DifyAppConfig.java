package com.sdecloud.springai.alibaba.common.domain;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Dify 应用配置实体
 * 用于管理多个 Dify 应用的配置信息
 * 注意：当前使用内存存储，后续可以迁移到数据库
 */
@Data
public class DifyAppConfig {
    
    /**
     * 主键ID
     */
    private Long id;
    
    /**
     * 应用名称
     */
    private String name;
    
    /**
     * Dify 应用ID
     */
    private String appId;
    
    /**
     * API Key（可选，如果为空则使用全局配置）
     */
    private String apiKey;
    
    /**
     * 应用类型：completion, chat, workflow
     */
    private String appType;
    
    /**
     * 输入参数模板（JSON格式）
     * 例如：{"meeting_content": ""} 或 {"query": ""}
     */
    private String inputTemplate;
    
    /**
     * 应用描述
     */
    private String description;
    
    /**
     * 是否启用
     */
    private Boolean enabled = true;
    
    /**
     * 排序号
     */
    private Integer sortOrder = 0;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 备注
     */
    private String remark;
}

