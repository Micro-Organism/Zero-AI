package com.sdecloud.springai.alibaba.service;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * RAG 服务接口
 */
public interface RagService {
    /**
     * 上传文档并向量化
     *
     * @param file 文档文件
     * @return 上传结果
     */
    Map<String, Object> uploadDocument(MultipartFile file);

    /**
     * RAG 查询
     *
     * @param query 查询文本
     * @param topK 返回结果数量
     * @return 查询结果
     */
    Map<String, Object> query(String query, Integer topK);

    /**
     * 流式 RAG 查询
     *
     * @param query 查询文本
     * @param topK 返回结果数量
     * @return SSE Emitter
     */
    SseEmitter streamQuery(String query, Integer topK);

    /**
     * 删除文档
     *
     * @param documentId 文档ID
     * @return 删除结果
     */
    Map<String, Object> deleteDocument(String documentId);

    /**
     * 获取文档列表
     *
     * @return 文档列表
     */
    Map<String, Object> getDocuments();
}

