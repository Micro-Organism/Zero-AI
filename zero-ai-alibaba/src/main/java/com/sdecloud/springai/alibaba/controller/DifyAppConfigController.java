package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.common.domain.DifyAppConfig;
import com.sdecloud.springai.alibaba.service.DifyAppConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dify 应用配置管理控制器
 */
@RestController
@RequestMapping("/api/dify/app-config")
@Slf4j
public class DifyAppConfigController {
    
    @Autowired
    private DifyAppConfigService appConfigService;
    
    /**
     * 获取所有应用配置
     */
    @GetMapping
    public Map<String, Object> getAll(@RequestParam(required = false, defaultValue = "false") Boolean enabledOnly) {
        try {
            List<DifyAppConfig> configs = enabledOnly 
                ? appConfigService.getAllEnabled()
                : appConfigService.getAll();
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取应用配置列表成功");
            result.put("data", configs);
            result.put("total", configs.size());
            return result;
        } catch (Exception e) {
            log.error("获取应用配置列表失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取应用配置列表失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 根据ID获取应用配置
     */
    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable Long id) {
        try {
            DifyAppConfig config = appConfigService.getById(id);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取应用配置成功");
            result.put("data", config);
            return result;
        } catch (Exception e) {
            log.error("获取应用配置失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取应用配置失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 创建应用配置
     */
    @PostMapping
    public Map<String, Object> create(@RequestBody DifyAppConfig config) {
        try {
            DifyAppConfig created = appConfigService.create(config);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "创建应用配置成功");
            result.put("data", created);
            return result;
        } catch (Exception e) {
            log.error("创建应用配置失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "创建应用配置失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 更新应用配置
     */
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody DifyAppConfig config) {
        try {
            DifyAppConfig updated = appConfigService.update(id, config);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "更新应用配置成功");
            result.put("data", updated);
            return result;
        } catch (Exception e) {
            log.error("更新应用配置失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "更新应用配置失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 删除应用配置
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        try {
            appConfigService.delete(id);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "删除应用配置成功");
            result.put("data", null);
            return result;
        } catch (Exception e) {
            log.error("删除应用配置失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "删除应用配置失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
    
    /**
     * 批量调用多个应用
     */
    @PostMapping("/batch-call")
    public Map<String, Object> batchCall(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> appIds = (List<String>) request.get("app_ids");
            @SuppressWarnings("unchecked")
            Map<String, Object> inputs = (Map<String, Object>) request.get("inputs");
            Boolean stream = (Boolean) request.getOrDefault("stream", false);
            
            if (appIds == null || appIds.isEmpty()) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "应用ID列表不能为空");
                result.put("data", null);
                return result;
            }
            
            List<Map<String, Object>> results = appConfigService.batchCall(appIds, inputs, stream != null && stream);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "批量调用完成");
            result.put("data", results);
            result.put("total", results.size());
            result.put("successCount", results.stream().mapToLong(r -> (Boolean) r.getOrDefault("success", false) ? 1 : 0).sum());
            return result;
        } catch (Exception e) {
            log.error("批量调用失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "批量调用失败: " + e.getMessage());
            result.put("data", null);
            return result;
        }
    }
}

