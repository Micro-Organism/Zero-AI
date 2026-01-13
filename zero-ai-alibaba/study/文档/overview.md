# Spring AI Alibaba 概览文档

> 参考文档：https://java2ai.com/docs/overview

## 📋 目录结构

### 1. 项目介绍
- Spring AI Alibaba 1.1 正式发布
- 构建 Agent 智能体应用最简单的方式
- 只需不到 10 行代码就可以构建智能体应用

### 2. 架构设计
- **Agent Framework**：以 ReactAgent 设计理念为核心的 Agent 开发框架
- **Graph**：低级别的工作流和多代理协调框架
- **Augmented LLM**：基于 Spring AI 框架的底层原子抽象

### 3. 设计原则
- 推荐使用 Agent Framework 内置的 `ReactAgent`
- 多智能体组合模式
- Graph API 的灵活使用场景

### 4. 安装
- Maven 依赖配置

### 5. 创建 Agent
- 基础示例代码

### 6. 核心功能
- ReactAgent
- 多代理编排
- 上下文工程
- 人机协同
- 流式传输支持
- 错误处理
- 基于图的工作流
- A2A 支持
- 丰富的模型、工具和 MCP 支持

---

## 📖 详细内容

### 1. 项目介绍

> **我们非常高兴的宣布，Spring AI Alibaba 1.1 正式发布!**

Spring AI Alibaba 是构建 Agent 智能体应用最简单的方式，只需不到 10 行代码就可以构建您的智能体应用。

### 2. 架构设计

Spring AI Alibaba 项目从架构上包含如下三层：

#### 2.1 Agent Framework（智能体框架层）

- **定位**：以 ReactAgent 设计理念为核心的 Agent 开发框架
- **能力**：
  - 自动上下文工程
  - 人机交互等核心能力
  - 使开发者能够构建具备完整功能的 Agent

#### 2.2 Graph（图工作流层）

- **定位**：低级别的工作流和多代理协调框架
- **能力**：
  - 实现复杂的应用程序编排
  - 丰富的预置节点
  - 简化的图状态定义
  - Graph 是 Agent Framework 的底层运行时基座

#### 2.3 Augmented LLM（增强 LLM 层）

- **定位**：以 Spring AI 框架底层原子抽象为基础
- **能力**：为构建大型语言模型（LLM）应用提供基础抽象
- **组件**：
  - 模型（Model）
  - 工具（Tool）
  - 多模态组件（MCP）
  - 消息（Message）
  - 向量存储（Vector Store）等

### 3. 设计原则

#### 3.1 推荐使用 ReactAgent

我们推荐您使用 Agent Framework 内置的 `ReactAgent` 抽象快速构建 Agent 应用。

#### 3.2 多智能体组合模式

如果您需要组合 Multi-agent，Agent Framework 还预置了以下基础多智能体工作流模式：

- **SequentialAgent（顺序代理）**：按顺序执行多个 Agent
- **ParallelAgent（并行代理）**：并行执行多个 Agent
- **RoutingAgent（路由代理）**：根据条件路由到不同的 Agent
- **LoopAgent（循环代理）**：循环执行 Agent 直到满足条件

#### 3.3 Graph API 的使用场景

对于一些开发场景而言，直接使用 `Graph API` 也是可行的，它能为应用开发提供：

- **更灵活的编排**：精确控制工作流
- **更直接的状态控制**：直接操作图状态
- **适用场景**：
  - 需要超高可靠性的场景
  - 大量自定义逻辑的场景
  - 需要精确控制延迟的场景

### 4. 安装

#### 4.1 Maven 依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-agent-framework</artifactId>
    <version>1.1.0.0-RC2</version>
</dependency>

<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
    <version>1.1.0.0-RC2</version>
</dependency>
```

### 5. 创建 Agent

#### 5.1 基础示例

```java
import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.alibaba.cloud.ai.graph.CompileConfig;
import org.springframework.ai.chat.model.ChatModel;

public class AgentExample {

    public static void main(String[] args) throws Exception {
        // 创建模型实例
        DashScopeApi dashScopeApi = DashScopeApi.builder()
            .apiKey(System.getenv("AI_DASHSCOPE_API_KEY"))
            .build();
        ChatModel chatModel = DashScopeChatModel.builder()
            .dashScopeApi(dashScopeApi)
            .build();

        // 创建 Agent
        ReactAgent agent = ReactAgent.builder()
            .name("weather_agent")
            .model(chatModel)
            .instruction("You are a helpful weather forecast assistant.")
            .build();

        // 运行 Agent
        agent.call("what is the weather in Hangzhou?");
    }
}
```

### 6. 核心功能

#### 6.1 ReactAgent

- **定义**：构建具有推理和行动能力的智能代理
- **范式**：遵循 ReAct（推理 + 行动）范式
- **用途**：用于迭代解决问题

#### 6.2 多代理编排

- **内置模式**：
  - `SequentialAgent`：顺序执行
  - `ParallelAgent`：并行执行
  - `LlmRoutingAgent`：LLM 路由
  - `LoopAgent`：循环执行
- **用途**：组合多个代理，以执行复杂的任务

#### 6.3 上下文工程

- **能力**：
  - 内置快速工程
  - 上下文管理
  - 对话流控制的最佳实践
- **目标**：提高代理的可靠性和性能

#### 6.4 人机协同

- **能力**：将人工反馈和审批步骤无缝集成到代理工作流程中
- **用途**：实现关键工具和操作的监督执行

#### 6.5 流式传输支持

- **能力**：代理响应的实时流式传输
- **用途**：提供更好的用户体验

#### 6.6 错误处理

- **能力**：
  - 强大的错误恢复机制
  - 重试机制
- **用途**：提高系统的可靠性

#### 6.7 基于图的工作流

- **能力**：
  - 基于图的工作流运行时和 API
  - 条件路由
  - 嵌套图
  - 并行执行
  - 状态管理
- **导出格式**：可将工作流导出为 PlantUML 和 Mermaid 格式

#### 6.8 A2A 支持（Agent-to-Agent）

- **能力**：通过 Nacos 集成支持代理间通信
- **用途**：实现跨服务的分布式代理协调和协作

#### 6.9 丰富的模型、工具和 MCP 支持

- **模型支持**：利用 Spring AI 的核心概念，支持多种 LLM 提供程序
  - DashScope（阿里云百炼）
  - OpenAI
  - 其他模型提供商
- **工具调用**：支持工具调用功能
- **MCP 支持**：支持模型上下文协议 (MCP)

## 📝 总结

### 架构层次

1. **Agent Framework**：高级抽象，快速构建 Agent 应用
2. **Graph**：底层工作流引擎，提供灵活的编排能力
3. **Augmented LLM**：基础抽象层，提供模型、工具等核心组件

### 设计理念

1. **简单易用**：只需不到 10 行代码即可构建 Agent
2. **灵活扩展**：支持从简单到复杂的各种场景
3. **生产就绪**：提供错误处理、流式传输、人机协同等生产级功能

### 核心优势

1. **快速开发**：ReactAgent 抽象简化了 Agent 开发
2. **多智能体支持**：内置多种多智能体工作流模式
3. **企业级特性**：A2A 支持、错误处理、流式传输等
4. **生态丰富**：支持多种模型、工具和 MCP

### 适用场景

1. **简单场景**：使用 ReactAgent 快速构建
2. **复杂场景**：使用多智能体组合模式
3. **超复杂场景**：直接使用 Graph API 进行精确控制

### 下一步

- 学习快速开始：https://java2ai.com/docs/quick-start
- 探索 Agent Framework 文档
- 了解 Graph Core 的使用
- 查看 Agent Chat UI 示例

