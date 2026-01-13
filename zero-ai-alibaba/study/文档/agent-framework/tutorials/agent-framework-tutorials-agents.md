# Agents - 智能体

> 参考文档：https://java2ai.com/docs/frameworks/agent-framework/tutorials/agents

## 📋 目录

### 1. ReactAgent 理论基础
- 什么是 ReAct
- ReactAgent 的工作原理

### 2. 核心组件
- Model（模型）
- Tools（工具）
- System Prompt（系统提示）

### 3. 调用 Agent
- 基础调用
- 获取完整状态
- 使用配置

### 4. 高级特性
- 结构化输出
- Memory（记忆）
- Hooks（钩子）
- Interceptors（拦截器）
- 控制与流式输出

### 5. 下一步

---

## 📖 详细内容

### 1. 概述

Agents 将大语言模型与工具结合，创建具备任务推理、工具使用决策、工具调用的自动化系统，系统具备持续推理、工具调用的循环迭代能力，直至问题解决。

Spring AI Alibaba 提供了基于 `ReactAgent` 的生产级 Agent 实现。

**一个 LLM Agent 在循环中通过运行工具来实现目标**。Agent 会一直运行直到满足停止条件 —— 即当模型输出最终答案或达到迭代限制时。

### 2. ReactAgent 理论基础

#### 2.1 什么是 ReAct

ReAct（Reasoning + Acting）是一种将推理和行动相结合的 Agent 范式。在这个范式中，Agent 会：

1. **思考（Reasoning）**：分析当前情况，决定下一步该做什么
2. **行动（Acting）**：执行工具调用或生成最终答案
3. **观察（Observation）**：接收工具执行的结果
4. **迭代**：基于观察结果继续思考和行动，直到完成任务

这个循环使 Agent 能够：

- 将复杂问题分解为多个步骤
- 动态调整策略基于中间结果
- 处理需要多次工具调用的任务
- 在不确定的环境中做出决策

#### 2.2 ReactAgent 的工作原理

Spring AI Alibaba 中的`ReactAgent` 基于 **Graph 运行时**构建。Graph 由节点（steps）和边（connections）组成，定义了 Agent 如何处理信息。Agent 在这个 Graph 中移动，执行如下节点：

- **Model Node (模型节点)**：调用 LLM 进行推理和决策
- **Tool Node (工具节点)**：执行工具调用
- **Hook Nodes (钩子节点)**：在关键位置插入自定义逻辑

ReactAgent 的核心执行流程：

```
用户输入 → Model Node (推理) → Tool Node (执行工具) → Model Node (继续推理) → 最终答案
```

### 3. 核心组件

#### 3.1 Model（模型）

Model 是 Agent 的推理引擎。Spring AI Alibaba 支持多种配置方式。

**基础模型配置：**

```java
import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.graph.agent.ReactAgent;

// 创建 DashScope API 实例
DashScopeApi dashScopeApi = DashScopeApi.builder()
  .apiKey(System.getenv("AI_DASHSCOPE_API_KEY"))
  .build();

// 创建 ChatModel
ChatModel chatModel = DashScopeChatModel.builder()
  .dashScopeApi(dashScopeApi)
  .build();

// 创建 Agent
ReactAgent agent = ReactAgent.builder()
  .name("my_agent")
  .model(chatModel)
  .build();
```

**高级模型配置：**

```java
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;

ChatModel chatModel = DashScopeChatModel.builder()
  .dashScopeApi(dashScopeApi)
  .defaultOptions(DashScopeChatOptions.builder()
    .withModel(DashScopeChatModel.DEFAULT_MODEL_NAME)
    .withTemperature(0.7)    // 控制随机性
    .withMaxToken(2000)      // 最大输出长度
    .withTopP(0.9)           // 核采样参数
    .build())
  .build();
```

**常用参数说明：**

- `temperature`：控制输出的随机性（0.0-1.0），值越高越有创造性
- `maxTokens`：限制单次响应的最大 token 数
- `topP`：核采样，控制输出的多样性

#### 3.2 Tools（工具）

工具赋予 Agent 执行操作的能力，支持顺序执行、并行调用、动态选择和错误处理。

**定义和使用工具：**

```java
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.ai.chat.model.ToolContext;
import java.util.function.BiFunction;

// 定义工具（示例：仅一个搜索工具）
public class SearchTool implements BiFunction<String, ToolContext, String> {
  @Override
  public String apply(String query, ToolContext context) {
      // 实现搜索逻辑
      return "搜索结果: " + query;
  }
}

// 创建工具回调
ToolCallback searchTool = FunctionToolCallback.builder("search", new SearchTool())
  .description("搜索工具")
  .build();

// 在Agent中使用
ReactAgent agent = ReactAgent.builder()
  .name("search_agent")
  .model(chatModel)
  .tools(searchTool)
  .build();
```

**工具错误处理：**

```java
import com.alibaba.cloud.ai.graph.agent.interceptor.ToolInterceptor;
import com.alibaba.cloud.ai.graph.agent.interceptor.ToolCallRequest;
import com.alibaba.cloud.ai.graph.agent.interceptor.ToolCallResponse;
import com.alibaba.cloud.ai.graph.agent.interceptor.ToolCallHandler;

public class ToolErrorInterceptor extends ToolInterceptor {
  @Override
  public ToolCallResponse interceptToolCall(ToolCallRequest request, ToolCallHandler handler) {
      try {
          return handler.call(request);
      } catch (Exception e) {
          return ToolCallResponse.of(request.getToolCallId(), request.getToolName(),
              "Tool failed: " + e.getMessage());
      }
  }

  @Override
  public String getName() {
      return "ToolErrorInterceptor";
  }
}

ReactAgent agent = ReactAgent.builder()
  .name("my_agent")
  .model(chatModel)
  .interceptors(new ToolErrorInterceptor())
  .build();
```

**ReAct 循环示例：**

```
用户: 查询杭州天气并推荐活动
→ [推理] 需要查天气 → [行动] get_weather("杭州") → [观察] 晴，25°C
→ [推理] 需要推荐活动 → [行动] search("户外活动") → [观察] 西湖游玩...
→ [推理] 信息充足 → [行动] 生成答案
```

#### 3.3 System Prompt（系统提示）

System Prompt 塑造 Agent 处理任务的方式。

**基础用法：**

```java
ReactAgent agent = ReactAgent.builder()
  .name("my_agent")
  .model(chatModel)
  .systemPrompt("你是一个专业的技术助手。请准确、简洁地回答问题。")
  .build();
```

**使用 instruction：**

```java
String instruction = """
  你是一个经验丰富的软件架构师。

  在回答问题时，请：
  1. 首先理解用户的核心需求
  2. 分析可能的技术方案
  3. 提供清晰的建议和理由
  4. 如果需要更多信息，主动询问

  保持专业、友好的语气。
  """;

ReactAgent agent = ReactAgent.builder()
  .name("architect_agent")
  .model(chatModel)
  .instruction(instruction)
  .build();
```

### 4. 调用 Agent

#### 4.1 基础调用

```java
import com.alibaba.cloud.ai.graph.RunnableConfig;
import org.springframework.ai.chat.messages.AssistantMessage;

RunnableConfig config = RunnableConfig.builder()
  .threadId("thread-123")
  .addMetadata("user_id", "user-1")
  .build();

AssistantMessage response = agent.call("查询北京天气", config);
System.out.println(response.getText());
```

#### 4.2 获取完整状态

```java
import com.alibaba.cloud.ai.graph.OverAllState;
import java.util.Optional;

Optional<OverAllState> state = agent.invoke("复杂任务", config);
if (state.isPresent()) {
    OverAllState overallState = state.get();
    // 访问消息历史
    List<Message> messages = overallState.value("messages", new ArrayList<>());
    // 访问其他状态信息
    System.out.println(overallState);
}
```

### 5. 高级特性

#### 5.1 结构化输出

使用 `outputType` 或 `outputSchema` 定义响应格式。

#### 5.2 Memory（记忆）

使用 `MemorySaver` 和 `threadId` 实现对话记忆。

#### 5.3 Hooks（钩子）

在关键位置插入自定义逻辑。

#### 5.4 Interceptors（拦截器）

拦截和修改工具调用。

#### 5.5 控制与流式输出

支持流式输出和实时监控。

### 6. 下一步

- 学习 多 Agent 编排 构建复杂系统
- 探索 Graph API 实现自定义工作流
- 查看 工具开发 扩展 Agent 能力
- 参考 示例项目 获取实践指导

## 📝 总结

### 核心概念

1. **ReAct 范式**：推理 + 行动的循环迭代
2. **Graph 运行时**：基于节点和边的执行流程
3. **工具集成**：通过工具扩展 Agent 能力
4. **系统提示**：塑造 Agent 行为

### 最佳实践

1. **模型配置**：根据任务调整 temperature、maxTokens 等参数
2. **工具设计**：提供清晰的工具描述和错误处理
3. **系统提示**：具体、可操作的指令
4. **状态管理**：使用 threadId 维护对话上下文

