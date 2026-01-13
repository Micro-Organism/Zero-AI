package com.sdecloud.springai.alibaba.service;

import com.sdecloud.springai.alibaba.common.domain.DifyAppConfig;

import java.util.List;
import java.util.Map;

/**
 * Dify 应用配置服务接口
 */
public interface DifyAppConfigService {
    
    /**
     * 获取所有应用配置
     */
    List<DifyAppConfig> getAll();
    
    /**
     * 获取所有启用的应用配置
     */
    List<DifyAppConfig> getAllEnabled();
    
    /**
     * 根据ID获取应用配置
     */
    DifyAppConfig getById(Long id);
    
    /**
     * 根据应用ID获取应用配置
     */
    DifyAppConfig getByAppId(String appId);
    
    /**
     * 创建应用配置
     */
    DifyAppConfig create(DifyAppConfig config);
    
    /**
     * 更新应用配置
     */
    DifyAppConfig update(Long id, DifyAppConfig config);
    
    /**
     * 删除应用配置
     */
    void delete(Long id);
    
    /**
     * 批量调用多个应用
     * 
     * @param appIds 应用ID列表
     * @param inputs 输入参数
     * @param stream 是否流式调用
     * @return 调用结果列表
     */
    List<Map<String, Object>> batchCall(List<String> appIds, Map<String, Object> inputs, boolean stream);
}

