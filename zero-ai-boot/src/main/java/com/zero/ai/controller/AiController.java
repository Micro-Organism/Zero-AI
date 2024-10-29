package com.zero.ai.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.StreamingChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {

    @Autowired
    EmbeddingClient embeddingClient;

    @Autowired
    ChatClient chatClient;

    @Autowired
    StreamingChatClient streamingChatClient;

    @GetMapping("embedding")
    public Map<String, Object> embed(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        EmbeddingResponse embeddingResponse = this.embeddingClient.embedForResponse(List.of(message));
        return Map.of("embedding", embeddingResponse);
    }

    @GetMapping("chat")
    public String chat(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        Prompt prompt = new Prompt(message);
        return chatClient.call(prompt).getResult().getOutput().getContent();
    }

    @GetMapping(value = "/ai/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        Prompt prompt = new Prompt(message);
        Flux<ChatResponse> flux = streamingChatClient.stream(prompt);
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        //订阅流式数据并使用SseEmitter发送
        flux.subscribe(
                data -> {
                    try {
                        emitter.send(data);
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                },
                error -> {
                    emitter.completeWithError(error);
                },
                () -> {
                    emitter.complete();
                }
        );
        return emitter;
    }

}