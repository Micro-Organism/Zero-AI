# Spring AI Alibaba 快速开始文档

> 参考文档：https://java2ai.com/docs/quick-start

## 📋 目录结构

### 1. 前置条件
- **环境要求**
  - JDK 17+
  - Maven 3.8+
  - 选择你的 LLM 提供商并获取 API-KEY（如阿里云百炼的 DashScope）

- **添加依赖**
  ```xml
  <dependencies>
    <!-- Spring AI Alibaba Agent Framework -->
    <dependency>
      <groupId>com.alibaba.cloud.ai</groupId>
      <artifactId>spring-ai-alibaba-agent-framework</artifactId>
      <version>1.1.0.0-RC2</version>
    </dependency>

    <!-- DashScope ChatModel 支持 -->
    <dependency>
      <groupId>com.alibaba.cloud.ai</groupId>
      <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
      <version>1.1.0.0-RC2</version>
    </dependency>
  </dependencies>
  ```

- **配置 API Key**
  - 推荐通过环境变量设置：`export AI_DASHSCOPE_API_KEY=your_api_key_here`
  - 或在配置文件中设置：
    ```yaml
    spring:
      ai:
        dashscope:
          api-key: ${AI_DASHSCOPE_API_KEY}
    ```
  - 获取 API Key：访问 https://bailian.console.aliyun.com/?apiKey=1&tab=api#/api

### 2. 构建一个基础 Agent

创建一个简单的 agent，它可以回答问题并调用工具。

**核心步骤：**
1. 初始化 ChatModel
2. 定义工具（Tool）
3. 创建 Agent
4. 运行 Agent

**示例代码：**
```java
// 初始化 ChatModel
DashScopeApi dashScopeApi = DashScopeApi.builder()
    .apiKey(System.getenv("AI_DASHSCOPE_API_KEY"))
    .build();

ChatModel chatModel = DashScopeChatModel.builder()
    .dashScopeApi(dashScopeApi)
    .build();

// 定义天气查询工具
public class WeatherTool implements BiFunction<String, ToolContext, String> {
    @Override
    public String apply(String city, ToolContext toolContext) {
        return "It's always sunny in " + city + "!";
    }
}

ToolCallback weatherTool = FunctionToolCallback.builder("get_weather", new WeatherTool())
    .description("Get weather for a given city")
    .inputType(String.class)
    .build();

// 创建 agent
ReactAgent agent = ReactAgent.builder()
    .name("weather_agent")
    .model(chatModel)
    .tools(weatherTool)
    .systemPrompt("You are a helpful assistant")
    .saver(new MemorySaver())
    .build();

// 运行 agent
AssistantMessage response = agent.call("what is the weather in San Francisco");
System.out.println(response.getText());
```

### 3. 构建一个真实的 Agent

构建一个实用的天气预报 agent，包含 6 个关键步骤：

#### 步骤 1：定义系统提示

系统提示定义了 agent 的角色和行为。保持具体和可操作：

```java
String SYSTEM_PROMPT = """
    You are an expert weather forecaster, who speaks in puns.

    You have access to two tools:

    - get_weather_for_location: use this to get the weather for a specific location
    - get_user_location: use this to get the user's location

    If a user asks you for the weather, make sure you know the location.
    If you can tell from the question that they mean wherever they are,
    use the get_user_location tool to find their location.
    """;
```

#### 步骤 2：创建工具

工具让模型能够通过调用你定义的函数与外部系统交互。

**关键点：**
- 工具可以依赖运行时上下文（通过 `ToolContext`）
- 工具应该具有良好的文档（名称、描述、参数名称）
- 使用 `@ToolParam` 注解添加参数元数据

**示例：**
```java
// 天气查询工具
public class WeatherForLocationTool implements BiFunction<String, ToolContext, String> {
    @Override
    public String apply(
        @ToolParam(description = "The city name") String city,
        ToolContext toolContext) {
        return "It's always sunny in " + city + "!";
    }
}

// 用户位置工具 - 使用上下文
public class UserLocationTool implements BiFunction<String, ToolContext, String> {
    @Override
    public String apply(
        @ToolParam(description = "User query") String query,
        ToolContext toolContext) {
        // 从上下文中获取用户信息
        String userId = "";
        if (toolContext != null && toolContext.getContext() != null) {
            RunnableConfig runnableConfig = (RunnableConfig) toolContext.getContext().get(AGENT_CONFIG_CONTEXT_KEY);
            Optional<Object> userIdObjOptional = runnableConfig.metadata("user_id");
            if (userIdObjOptional.isPresent()) {
                userId = (String) userIdObjOptional.get();
            }
        }
        if (userId == null) {
            userId = "1";
        }
        return "1".equals(userId) ? "Florida" : "San Francisco";
    }
}

// 创建工具回调
ToolCallback getWeatherTool = FunctionToolCallback
    .builder("getWeatherForLocation", new WeatherForLocationTool())
    .description("Get weather for a given city")
    .inputType(String.class)
    .build();

ToolCallback getUserLocationTool = FunctionToolCallback
    .builder("getUserLocation", new UserLocationTool())
    .description("Retrieve user location based on user ID")
    .inputType(String.class)
    .build();
```

#### 步骤 3：配置模型

为你的用例配置合适的大语言模型参数：

```java
DashScopeChatOptions options = DashScopeChatOptions.builder()
    .model("qwen-plus")
    .temperature(0.7)
    .build();

ChatModel chatModel = DashScopeChatModel.builder()
    .dashScopeApi(dashScopeApi)
    .defaultOptions(options)
    .build();
```

#### 步骤 4：定义响应格式

如果你需要 agent 响应匹配特定的模式，可以定义结构化响应格式。

```java
public class ResponseFormat {
    // 一个双关语响应（始终必需）
    private String punnyResponse;

    // 如果可用的话，关于天气的任何有趣信息
    private String weatherConditions;

    // Getters and Setters
    public String getPunnyResponse() {
        return punnyResponse;
    }

    public void setPunnyResponse(String punnyResponse) {
        this.punnyResponse = punnyResponse;
    }

    public String getWeatherConditions() {
        return weatherConditions;
    }

    public void setWeatherConditions(String weatherConditions) {
        this.weatherConditions = weatherConditions;
    }
}
```

**使用方式：**
```java
ReactAgent agent = ReactAgent.builder()
    .name("weather_agent")
    .outputType(ResponseFormat.class)  // 指定输出格式
    .build();
```

#### 步骤 5：添加记忆

为你的 agent 添加记忆以维持跨交互的状态。使用 `MemorySaver` 和 `threadId` 实现对话记忆。

```java
ReactAgent agent = ReactAgent.builder()
    .name("weather_agent")
    .saver(new MemorySaver())  // 添加记忆
    .build();
```

**调用时使用 threadId：**
```java
RunnableConfig runnableConfig = RunnableConfig.builder()
    .threadId(threadId)
    .addMetadata("user_id", "1")
    .build();

// 第一次调用
AssistantMessage response = agent.call("what is the weather in San Francisco today.", runnableConfig);

// 第二次调用（使用相同的 threadId，可以记住之前的对话）
response = agent.call("How about the weather tomorrow", runnableConfig);
```

**注意：** 在生产环境中，使用持久化的 CheckPointer 将数据保存到数据库。

#### 步骤 6：创建和运行 Agent

用所有组件组装你的 agent 并运行它：

```java
ReactAgent agent = ReactAgent.builder()
    .name("weather_pun_agent")
    .model(chatModel)
    .systemPrompt(SYSTEM_PROMPT)
    .tools(getUserLocationTool, getWeatherTool)
    .outputType(ResponseFormat.class)
    .saver(new MemorySaver())
    .build();

RunnableConfig runnableConfig = RunnableConfig.builder()
    .threadId(threadId)
    .addMetadata("user_id", "1")
    .build();

// 第一次调用
AssistantMessage response = agent.call("what is the weather outside?", runnableConfig);
System.out.println(response.getText());
```

### 4. 查看完整示例代码

完整示例代码请查看仓库：https://github.com/spring-ai-alibaba/examples

### 5. 开启高级功能

#### 使用 outputSchema 定义输出格式

除了使用 `outputType`，你还可以使用 `outputSchema` 来定义自定义的 JSON 格式：

```java
String customSchema = """
    请按照以下JSON格式输出：
    {
        "title": "标题",
        "content": "内容",
        "style": "风格"
    }
    """;

ReactAgent agent = ReactAgent.builder()
    .name("schema_agent")
    .model(chatModel)
    .saver(new MemorySaver())
    .outputSchema(customSchema)
    .build();

AssistantMessage message = agent.call("帮我写一首关于春天的诗歌。");
System.out.println(message.getText());
```

#### 使用 invoke 方法获取完整状态

如果需要访问完整的 agent 状态（不仅仅是最后的消息），可以使用 `invoke` 方法：

```java
import com.alibaba.cloud.ai.graph.OverAllState;
import java.util.Optional;

Optional<OverAllState> result = agent.invoke("帮我写一首诗。");

if (result.isPresent()) {
    OverAllState state = result.get();
    // 访问消息历史
    List<Message> messages = state.value("messages", new ArrayList<>());
    // 访问其他状态信息
    System.out.println(state);
}
```

#### 配置最大迭代次数

为防止无限循环，可以使用 `ModelCallLimitHook` 来限制模型调用次数：

```java
import com.alibaba.cloud.ai.graph.agent.hook.modelcalllimit.ModelCallLimitHook;

ModelCallLimitHook hook = ModelCallLimitHook.builder()
    .runLimit(5)  // 限制最多调用 5 次
    .exitBehavior(ModelCallLimitHook.ExitBehavior.ERROR)  // 超出限制时抛出异常
    .build();

ReactAgent agent = ReactAgent.builder()
    .name("my_agent")
    .model(chatModel)
    .hooks(hook)
    .saver(new MemorySaver())
    .build();
```

#### 使用 Hooks 扩展功能

ReactAgent 支持通过 Hooks 扩展功能，例如人机协同、工具注入等：

```java
import com.alibaba.cloud.ai.graph.agent.hook.Hook;
import com.alibaba.cloud.ai.graph.agent.hook.hip.HumanInTheLoopHook;

// 创建 hook
Hook humanInTheLoopHook = HumanInTheLoopHook.builder()
    .approvalOn("getWeatherTool", ToolConfig.builder()
        .description("Please confirm tool execution.")
        .build())
    .build();

ReactAgent agent = ReactAgent.builder()
    .name("my_agent")
    .model(chatModel)
    .hooks(humanInTheLoopHook)
    .saver(new MemorySaver())
    .build();
```

## 📝 总结

### 核心概念

1. **ReactAgent**：遵循 ReAct（推理 + 行动）范式的智能代理
2. **工具（Tool）**：让模型能够调用外部函数
3. **结构化输出**：使用 `outputType` 或 `outputSchema` 定义响应格式
4. **对话记忆**：使用 `MemorySaver` 和 `threadId` 实现跨交互的状态保持
5. **Hooks**：扩展功能，如人机协同、工具注入、调用限制等

### 最佳实践

1. **系统提示**：保持具体和可操作
2. **工具文档**：提供清晰的名称、描述和参数说明
3. **结构化输出**：使用 `outputType` 或 `outputSchema` 获得可预测的结果
4. **对话记忆**：在生产环境中使用持久化的 CheckPointer
5. **错误处理**：使用 Hooks 限制调用次数，防止无限循环

### 下一步

- 探索更多的工具集成
- 学习如何使用不同的 Checkpoint 实现对话持久化
- 了解如何使用 Hooks 扩展 agent 功能
- 学习如何创建多 agent 系统

