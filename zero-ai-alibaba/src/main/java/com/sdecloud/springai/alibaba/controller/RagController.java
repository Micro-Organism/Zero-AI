package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.RagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

/**
 * RAG（检索增强生成）Controller
 * 提供文档上传、向量化、检索等功能
 */
@RestController
@RequestMapping("/api/rag")
public class RagController {

    @Autowired
    private RagService ragService;

    /**
     * 上传文档并向量化
     *
     * @param file 文档文件
     * @return 上传结果
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = ragService.uploadDocument(file);
        return ResponseEntity.ok(result);
    }

    /**
     * RAG 查询
     *
     * @param request 查询请求
     * @return 查询结果
     */
    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> query(@RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Integer topK = (Integer) request.getOrDefault("topK", 5);
        
        Map<String, Object> result = ragService.query(query, topK);
        return ResponseEntity.ok(result);
    }

    /**
     * 流式 RAG 查询
     *
     * @param response HTTP 响应对象
     * @param request 查询请求
     * @return SSE 流
     */
    @PostMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamQuery(
            HttpServletResponse response,
            @RequestBody Map<String, Object> request) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        String query = (String) request.get("query");
        Integer topK = (Integer) request.getOrDefault("topK", 5);

        return ragService.streamQuery(query, topK);
    }

    /**
     * 删除文档
     *
     * @param documentId 文档ID
     * @return 删除结果
     */
    @DeleteMapping("/document/{documentId}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable String documentId) {
        Map<String, Object> result = ragService.deleteDocument(documentId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取文档列表
     *
     * @return 文档列表
     */
    @GetMapping("/documents")
    public ResponseEntity<Map<String, Object>> getDocuments() {
        Map<String, Object> result = ragService.getDocuments();
        return ResponseEntity.ok(result);
    }
}

