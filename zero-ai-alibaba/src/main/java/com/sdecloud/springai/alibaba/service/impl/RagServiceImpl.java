package com.sdecloud.springai.alibaba.service.impl;

import com.sdecloud.springai.alibaba.service.RagService;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * RAG 服务实现类
 * 注意：这是一个简化实现，完整的 RAG 需要配置 EmbeddingModel 和 VectorStore
 */
@Service
public class RagServiceImpl implements RagService {

    @Autowired(required = false)
    @Qualifier("deepSeekChatModel")
    private ChatModel chatModel;

    @Autowired(required = false)
    private EmbeddingModel embeddingModel;

    @Autowired(required = false)
    private VectorStore vectorStore;

    // 内存存储文档（简化实现）
    private final Map<String, Document> documentStore = new HashMap<>();

    @Override
    public Map<String, Object> uploadDocument(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();

        try {
            String content = new String(file.getBytes());
            String documentId = UUID.randomUUID().toString();

            // 创建文档（Document 构造函数：content, metadata）
            Document document = new Document(content, Map.of(
                    "id", documentId,
                    "filename", file.getOriginalFilename(),
                    "contentType", file.getContentType(),
                    "size", file.getSize()
            ));

            // 存储文档
            documentStore.put(documentId, document);

            // 如果有 VectorStore，进行向量化
            if (vectorStore != null && embeddingModel != null) {
                vectorStore.add(List.of(document));
            }

            result.put("success", true);
            result.put("documentId", documentId);
            result.put("message", "文档上传成功");
        } catch (IOException e) {
            result.put("success", false);
            result.put("error", "文档上传失败: " + e.getMessage());
        }

        return result;
    }

    @Override
    public Map<String, Object> query(String query, Integer topK) {
        Map<String, Object> result = new HashMap<>();

        if (chatModel == null) {
            result.put("error", "ChatModel 未配置");
            return result;
        }

        try {
            List<Document> relevantDocs = new ArrayList<>();

            // 如果有 VectorStore，进行向量检索
            if (vectorStore != null && embeddingModel != null) {
                // 使用 SearchRequest 进行检索
                SearchRequest searchRequest = SearchRequest.builder()
                        .query(query)
                        .topK(topK != null ? topK : 4)
                        .build();
                relevantDocs = vectorStore.similaritySearch(searchRequest);
            } else {
                // 简化实现：返回所有文档
                relevantDocs = new ArrayList<>(documentStore.values());
                int limit = topK != null ? topK : 4;
                if (relevantDocs.size() > limit) {
                    relevantDocs = relevantDocs.subList(0, limit);
                }
            }

            // 构建上下文
            StringBuilder context = new StringBuilder();
            for (Document doc : relevantDocs) {
                context.append(doc.getText()).append("\n\n");
            }

            // 使用 ChatModel 生成回答
            String promptText = String.format("""
                    基于以下文档内容回答问题：
                    
                    %s
                    
                    问题：%s
                    
                    请基于文档内容回答，如果文档中没有相关信息，请说明。
                    """, context.toString(), query);

            // 调用 ChatModel 生成回答
            String answer;
            if (chatModel != null) {
                try {
                    Prompt prompt = new Prompt(new UserMessage(promptText));
                    ChatResponse response = chatModel.call(prompt);
                    answer = response.getResult().getOutput().getText();
                } catch (Exception e) {
                    answer = "生成回答时出错: " + e.getMessage();
                }
            } else {
                answer = "ChatModel 未配置，无法生成回答";
            }

            result.put("success", true);
            result.put("answer", answer);
            result.put("documents", relevantDocs.stream()
                    .map(doc -> {
                        String content = doc.getText();
                        return Map.of(
                                "id", doc.getId(),
                                "content", content.length() > 100 ? content.substring(0, 100) : content
                        );
                    })
                    .toList());
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "查询失败: " + e.getMessage());
        }

        return result;
    }

    @Override
    public SseEmitter streamQuery(String query, Integer topK) {
        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> result = query(query, topK);
                String answer = (String) result.get("answer");

                if (answer != null) {
                    // 模拟流式输出
                    String[] words = answer.split(" ");
                    for (String word : words) {
                        emitter.send(SseEmitter.event()
                                .name("message")
                                .data(word + " "));
                        Thread.sleep(50);
                    }
                }

                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(""));

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("查询失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Override
    public Map<String, Object> deleteDocument(String documentId) {
        Map<String, Object> result = new HashMap<>();

        if (documentStore.containsKey(documentId)) {
            documentStore.remove(documentId);
            result.put("success", true);
            result.put("message", "文档删除成功");
        } else {
            result.put("success", false);
            result.put("error", "文档不存在");
        }

        return result;
    }

    @Override
    public Map<String, Object> getDocuments() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> documents = documentStore.values().stream()
                .map(doc -> {
                    String content = doc.getText();
                    return Map.of(
                            "id", doc.getId(),
                            "content", content.length() > 200 ? content.substring(0, 200) : content,
                            "metadata", doc.getMetadata()
                    );
                })
                .toList();

        result.put("success", true);
        result.put("documents", documents);
        result.put("count", documents.size());
        return result;
    }
}

