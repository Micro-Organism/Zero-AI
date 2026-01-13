package com.sdecloud.springai.alibaba.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 多模态服务接口
 */
public interface MultimodalService {
    /**
     * 图像生成
     *
     * @param prompt 提示词
     * @param width 宽度
     * @param height 高度
     * @return 生成结果
     */
    Map<String, Object> generateImage(String prompt, Integer width, Integer height);

    /**
     * 图像理解
     *
     * @param file 图像文件
     * @param prompt 提示词
     * @return 理解结果
     */
    Map<String, Object> understandImage(MultipartFile file, String prompt);

    /**
     * 文本转语音
     *
     * @param text 文本
     * @param voice 语音类型
     * @return 音频数据
     */
    Map<String, Object> textToSpeech(String text, String voice);

    /**
     * 语音转文本
     *
     * @param file 音频文件
     * @return 文本结果
     */
    Map<String, Object> speechToText(MultipartFile file);

    /**
     * 多模态对话
     *
     * @param text 文本
     * @param imageUrls 图像URL列表
     * @return 对话结果
     */
    Map<String, Object> multimodalChat(String text, List<String> imageUrls);
}

