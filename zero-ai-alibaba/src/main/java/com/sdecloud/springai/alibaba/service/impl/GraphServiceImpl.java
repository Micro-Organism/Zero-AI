package com.sdecloud.springai.alibaba.service.impl;

import com.alibaba.cloud.ai.graph.CompiledGraph;
import com.alibaba.cloud.ai.graph.CompileConfig;
import com.alibaba.cloud.ai.graph.KeyStrategy;
import com.alibaba.cloud.ai.graph.KeyStrategyFactory;
import com.alibaba.cloud.ai.graph.NodeOutput;
import com.alibaba.cloud.ai.graph.OverAllState;
import com.alibaba.cloud.ai.graph.RunnableConfig;
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.action.NodeAction;
import com.alibaba.cloud.ai.graph.checkpoint.config.SaverConfig;
import com.alibaba.cloud.ai.graph.checkpoint.savers.MemorySaver;
import com.alibaba.cloud.ai.graph.state.strategy.ReplaceStrategy;
import com.sdecloud.springai.alibaba.service.GraphService;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static com.alibaba.cloud.ai.graph.StateGraph.END;
import static com.alibaba.cloud.ai.graph.StateGraph.START;
import static com.alibaba.cloud.ai.graph.action.AsyncNodeAction.node_async;

/**
 * Graph 工作流服务实现类
 */
@Service
public class GraphServiceImpl implements GraphService {

    @Autowired(required = false)
    @Qualifier("deepSeekChatModel")
    private ChatModel chatModel;

    /**
     * 创建 KeyStrategyFactory
     */
    private KeyStrategyFactory createKeyStrategyFactory() {
        return () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", new ReplaceStrategy());
            strategies.put("output", new ReplaceStrategy());
            strategies.put("message", new ReplaceStrategy());
            strategies.put("processed", new ReplaceStrategy());
            strategies.put("branch1", new ReplaceStrategy());
            strategies.put("branch2", new ReplaceStrategy());
            return strategies;
        };
    }

    /**
     * 简单的处理节点
     */
    private static class ProcessNode implements NodeAction {
        private final String message;

        public ProcessNode(String message) {
            this.message = message;
        }

        @Override
        public Map<String, Object> apply(OverAllState state) throws Exception {
            Map<String, Object> result = new HashMap<>();
            result.put("message", message);
            result.put("processed", true);
            result.put("output", "处理完成: " + message);
            return result;
        }
    }

    /**
     * 分支1节点
     */
    private static class Branch1Node implements NodeAction {
        @Override
        public Map<String, Object> apply(OverAllState state) throws Exception {
            Map<String, Object> result = new HashMap<>();
            result.put("branch1", "处理分支1");
            result.put("output", "分支1处理完成");
            return result;
        }
    }

    /**
     * 分支2节点
     */
    private static class Branch2Node implements NodeAction {
        @Override
        public Map<String, Object> apply(OverAllState state) throws Exception {
            Map<String, Object> result = new HashMap<>();
            result.put("branch2", "处理分支2");
            result.put("output", "分支2处理完成");
            return result;
        }
    }

    @Override
    public Map<String, Object> executeSimpleGraph(String message, String threadId) {
        Map<String, Object> result = new HashMap<>();

        if (chatModel == null) {
            result.put("error", "ChatModel 未配置");
            return result;
        }

        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            // 创建节点
            var processNode = node_async(new ProcessNode(message));

            // 创建 StateGraph
            StateGraph workflow = new StateGraph(createKeyStrategyFactory())
                    .addNode("process", processNode);

            // 添加边
            workflow.addEdge(START, "process");
            workflow.addEdge("process", END);

            // 配置持久化
            var memory = new MemorySaver();
            var compileConfig = CompileConfig.builder()
                    .saverConfig(SaverConfig.builder()
                            .register(memory)
                            .build())
                    .build();

            // 编译 Graph
            CompiledGraph compiledGraph = workflow.compile(compileConfig);

            // 执行 Graph
            RunnableConfig config = RunnableConfig.builder()
                    .threadId(threadId)
                    .build();

            Map<String, Object> initialState = Map.of("input", message);
            Optional<OverAllState> stateOpt = compiledGraph.invoke(initialState, config);
            
            Map<String, Object> finalState = new HashMap<>();
            if (stateOpt.isPresent()) {
                finalState = stateOpt.get().data();
            }

            result.put("success", true);
            result.put("threadId", threadId);
            result.put("result", finalState);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    @Override
    public SseEmitter streamGraph(String message, String threadId) {
        SseEmitter emitter = new SseEmitter(0L);

        final String finalThreadId = (threadId == null || threadId.isEmpty()) 
                ? UUID.randomUUID().toString() 
                : threadId;

        CompletableFuture.runAsync(() -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("threadId")
                        .data(finalThreadId));

                // 创建节点
                var processNode = node_async(new ProcessNode(message));

                // 创建 StateGraph
                StateGraph workflow = new StateGraph(createKeyStrategyFactory())
                        .addNode("process", processNode);

                // 添加边
                workflow.addEdge(START, "process");
                workflow.addEdge("process", END);

                // 配置持久化
                var memory = new MemorySaver();
                var compileConfig = CompileConfig.builder()
                        .saverConfig(SaverConfig.builder()
                                .register(memory)
                                .build())
                        .build();

                // 编译 Graph
                CompiledGraph compiledGraph = workflow.compile(compileConfig);

                // 执行 Graph（流式）
                RunnableConfig config = RunnableConfig.builder()
                        .threadId(finalThreadId)
                        .build();

                Map<String, Object> initialState = Map.of("input", message);
                Flux<NodeOutput> stream = compiledGraph.stream(initialState, config);

                // 流式输出
                stream.subscribe(
                        output -> {
                            try {
                                // NodeOutput 包含节点执行信息，直接转换为字符串
                                String outputStr = output.toString();
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data("节点执行: " + outputStr));
                            } catch (Exception e) {
                                // 忽略错误，继续处理
                            }
                        },
                        error -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("error")
                                        .data("执行失败: " + error.getMessage()));
                            } catch (IOException ioException) {
                                // 忽略
                            }
                            emitter.completeWithError(error);
                        },
                        () -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("done")
                                        .data(""));
                            } catch (IOException e) {
                                // 忽略
                            }
                            emitter.complete();
                        }
                );
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("执行失败: " + e.getMessage()));
                } catch (IOException ioException) {
                    // 忽略
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Override
    public Map<String, Object> executeParallelGraph(String message, String threadId) {
        Map<String, Object> result = new HashMap<>();

        if (chatModel == null) {
            result.put("error", "ChatModel 未配置");
            return result;
        }

        try {
            if (threadId == null || threadId.isEmpty()) {
                threadId = UUID.randomUUID().toString();
            }

            // 创建节点
            var branch1Node = node_async(new Branch1Node());
            var branch2Node = node_async(new Branch2Node());

            // 创建 StateGraph
            StateGraph workflow = new StateGraph(createKeyStrategyFactory())
                    .addNode("branch1", branch1Node)
                    .addNode("branch2", branch2Node);

            // 添加边（并行执行）
            workflow.addEdge(START, "branch1");
            workflow.addEdge(START, "branch2");
            workflow.addEdge("branch1", END);
            workflow.addEdge("branch2", END);

            // 配置持久化
            var memory = new MemorySaver();
            var compileConfig = CompileConfig.builder()
                    .saverConfig(SaverConfig.builder()
                            .register(memory)
                            .build())
                    .build();

            // 编译 Graph
            CompiledGraph compiledGraph = workflow.compile(compileConfig);

            // 执行 Graph
            RunnableConfig config = RunnableConfig.builder()
                    .threadId(threadId)
                    .build();

            Map<String, Object> initialState = Map.of("input", message);
            Optional<OverAllState> stateOpt = compiledGraph.invoke(initialState, config);
            
            Map<String, Object> finalState = new HashMap<>();
            if (stateOpt.isPresent()) {
                finalState = stateOpt.get().data();
            }

            result.put("success", true);
            result.put("threadId", threadId);
            result.put("result", finalState);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    @Override
    public Map<String, Object> getGraphStatus(String threadId) {
        Map<String, Object> status = new HashMap<>();
        status.put("threadId", threadId);
        status.put("status", "running");
        status.put("chatModelAvailable", chatModel != null);
        return status;
    }
}

