package com.sdecloud.springai.alibaba.controller;

import com.sdecloud.springai.alibaba.service.MultimodalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;

import java.util.List;
import java.util.Map;

/**
 * 多模态 Controller
 * 提供图像生成、图像理解、音频处理等功能
 */
@RestController
@RequestMapping("/api/multimodal")
public class MultimodalController {

    @Autowired
    private MultimodalService multimodalService;

    /**
     * 图像生成
     *
     * @param request 生成请求
     * @return 生成结果
     */
    @PostMapping("/image/generate")
    public ResponseEntity<Map<String, Object>> generateImage(@RequestBody Map<String, Object> request) {
        String prompt = (String) request.get("prompt");
        Integer width = (Integer) request.getOrDefault("width", 1024);
        Integer height = (Integer) request.getOrDefault("height", 1024);
        
        Map<String, Object> result = multimodalService.generateImage(prompt, width, height);
        return ResponseEntity.ok(result);
    }

    /**
     * 图像理解
     *
     * @param file 图像文件
     * @param prompt 提示词
     * @return 理解结果
     */
    @PostMapping("/image/understand")
    public ResponseEntity<Map<String, Object>> understandImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "prompt", required = false, defaultValue = "请描述这张图片") String prompt) {
        Map<String, Object> result = multimodalService.understandImage(file, prompt);
        return ResponseEntity.ok(result);
    }

    /**
     * 文本转语音（TTS）
     *
     * @param request 转换请求
     * @return 音频数据
     */
    @PostMapping("/audio/tts")
    public ResponseEntity<Map<String, Object>> textToSpeech(@RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        String voice = (String) request.getOrDefault("voice", "default");
        
        Map<String, Object> result = multimodalService.textToSpeech(text, voice);
        return ResponseEntity.ok(result);
    }

    /**
     * 语音转文本（STT）
     *
     * @param file 音频文件
     * @return 文本结果
     */
    @PostMapping("/audio/stt")
    public ResponseEntity<Map<String, Object>> speechToText(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = multimodalService.speechToText(file);
        return ResponseEntity.ok(result);
    }

    /**
     * 多模态对话（文本 + 图像）
     *
     * @param request 对话请求
     * @return 对话结果
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> multimodalChat(@RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        @SuppressWarnings("unchecked")
        List<String> imageUrls = (List<String>) request.get("imageUrls");
        
        Map<String, Object> result = multimodalService.multimodalChat(text, imageUrls);
        return ResponseEntity.ok(result);
    }
}

