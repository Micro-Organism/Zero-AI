# Spring AI Alibaba Examples 总结

> **GitHub 官方地址**: https://github.com/spring-ai-alibaba/examples
>
> **本地代码路径**: /Users/rabbit/works/code/github/Repository/spring-ai-alibaba-examples
>
> **官方文档**: https://java2ai.com

## 📋 目录

- [项目概览](#项目概览)
- [Examples 模块分类](#examples-模块分类)
- [详细模块说明](#详细模块说明)
- [学习路径建议](#学习路径建议)
- [与项目对比](#与项目对比)
- [GitHub 更新检查](#github-更新检查)

---

## 📊 项目概览

### 基本信息

- **项目名称**: Spring AI Alibaba Examples
- **版本**: 1.1.0.0
- **Spring Boot 版本**: 3.5.7
- **Spring AI 版本**: 1.1.0
- **Java 版本**: 17+
- **总模块数**: 98 个独立模块
  - **主模块**: 11 个（第一层目录，有独立 pom.xml）
  - **子模块**: 87 个（子目录中的独立工程模块）

### 项目结构

**重要说明**：
- **主模块**（11个）：第一层目录，有独立的 `pom.xml` 和 `src` 目录
- **子模块**（87个）：子目录中的独立工程模块
- **总计**：98 个独立模块

#### 主模块列表（11个）

```
spring-ai-alibaba-examples/
├── spring-ai-alibaba-helloworld/              # 快速开始（主模块）
├── spring-ai-alibaba-chat-memory-example/     # 对话记忆示例（主模块）
├── spring-ai-alibaba-structured-example/      # 结构化输出示例（主模块）
├── spring-ai-alibaba-tool-calling-example/    # 工具调用示例（主模块）
├── spring-ai-alibaba-prompt-example/          # Prompt 示例（主模块）
├── spring-ai-alibaba-nacos-prompt-example/    # Nacos Prompt 示例（主模块）
├── spring-ai-alibaba-evaluation-example/      # 评估示例（主模块）
├── spring-ai-alibaba-mem0-example/            # Mem0 记忆示例（主模块）
├── spring-ai-alibaba-more-platform-and-model-example/  # 更多平台和模型（主模块）
├── spring-ai-alibaba-bailian-example/         # 百炼示例（主模块）
└── spring-ai-alibaba-playground/             # 综合演示平台（主模块）
```

#### 容器目录（包含子模块）

```
├── spring-ai-alibaba-agent-example/            # Agent 示例容器（4个子模块）
│   ├── react-agent-example/
│   ├── playground-flight-booking/
│   ├── a2a-server-example/
│   └── a2a-client-example/
│
├── spring-ai-alibaba-chat-example/            # 对话示例容器（8个子模块）
│   ├── dashscope-chat/
│   ├── deepseek-chat/
│   ├── openai-chat/
│   ├── azure-openai-chat/
│   ├── ollama-chat/
│   ├── moonshot-chat/
│   ├── zhipuai-chat/
│   ├── qwq-chat/
│   └── vllm-chat/
│
├── spring-ai-alibaba-graph-example/           # Graph 工作流示例容器（17个子模块）
│   ├── react/
│   ├── chatflow/
│   ├── stream-node/
│   ├── parallel-node/
│   ├── parallel-stream-node/
│   ├── human-node/
│   ├── mcp-node/
│   ├── big-tool/
│   ├── reflection/
│   ├── multiagent-openmanus/
│   ├── product-analysis-graph/
│   ├── usecase-field-classifier/
│   ├── workflow-review-classifier/
│   ├── workflow-writing-assistant/
│   ├── issue-clarify-graph-example/
│   ├── interruptable-action-example/
│   └── graph-observability-langfuse/
│
├── spring-ai-alibaba-rag-example/             # RAG 示例容器（15个子模块）
│   ├── module-rag/
│   ├── rag-etl-pipeline-example/
│   ├── rag-pgvector-example/
│   ├── rag-milvus-example/
│   ├── rag-elasticsearch-example/
│   ├── rag-openai-dashscope-pgvector-example/
│   ├── rag-component-example/
│   ├── rag-elasticsearch-autoconfigure-example/
│   ├── bailian-rag-knowledge/
│   ├── bailian-agent/
│   ├── web-search/
│   └── spring-ai-alibaba-vector-databases-example/  # 向量数据库容器（5个子模块）
│       ├── vector-simple-example/
│       ├── vector-redis-example/
│       ├── vector-neo4j-example/
│       ├── vector-oceanbase-example/
│       └── vector-opensearch-example/
│
├── spring-ai-alibaba-mcp-example/              # MCP 示例容器（22个子模块）
│   ├── spring-ai-alibaba-mcp-starter-example/  # 快速入门（10个子模块）
│   │   ├── server/mcp-annotation-server/
│   │   ├── server/mcp-stdio-server-example/
│   │   ├── server/mcp-webflux-server-example/
│   │   ├── server/mcp-streamable-webflux-server/
│   │   ├── server/mcp-streamable-webmvc-server/
│   │   ├── client/mcp-annotation-client/
│   │   ├── client/mcp-stdio-client-example/
│   │   ├── client/mcp-webflux-client-example/
│   │   ├── client/mcp-streamable-webflux-client/
│   │   └── client/mcp-sdk-streamable-client-example/
│   ├── spring-ai-alibaba-mcp-manual-example/  # 手动配置（4个子模块）
│   │   ├── ai-mcp-fileserver/
│   │   ├── ai-mcp-github/
│   │   └── sqlite/ai-mcp-sqlite/
│   │   └── sqlite/ai-mcp-sqlite-chatbot/
│   ├── spring-ai-alibaba-mcp-build-example/   # 自定义构建（1个子模块）
│   │   └── starter-stock-server/
│   ├── spring-ai-alibaba-mcp-nacos-example/   # Nacos 集成（3个子模块）
│   │   ├── server/mcp-nacos-register-extensions-example/
│   │   ├── server/mcp-nacos-gateway-example/
│   │   └── client/mcp-nacos-distributed-extensions-example/
│   ├── spring-ai-alibaba-mcp-auth-example/    # 认证授权（2个子模块）
│   │   ├── server/mcp-auth-web-server/
│   │   └── client/mcp-auth-client/
│   └── spring-ai-alibaba-mcp-config-example/  # 配置管理（1个子模块）
│
├── spring-ai-alibaba-multi-model-example/     # 多模态示例容器（3个子模块）
│   ├── dashscope-multi-model/
│   ├── openai-dashscope-multi-model/
│   └── ark-multi-model/
│
├── spring-ai-alibaba-image-example/           # 图像生成示例容器（2个子模块）
│   ├── dashscope-image/
│   └── openai-image/
│
├── spring-ai-alibaba-audio-example/           # 音频处理示例容器（1个子模块）
│   └── dashscope-audio/
│
├── spring-ai-alibaba-video-example/           # 视频处理示例容器（1个子模块）
│   └── dashscope-video/
│
├── spring-ai-alibaba-observability-example/  # 可观测性示例容器（4个子模块）
│   ├── observability-example/
│   ├── observability-arms-example/
│   ├── observability-langfuse-example/
│   └── observationhandler-example/
│
├── spring-ai-alibaba-nl2sql-example/         # NL2SQL 示例容器（3个子模块）
│   ├── chat/
│   ├── mcp/
│   └── vector-management/
│
└── spring-ai-alibaba-usecase-example/         # 实际用例示例容器（8个子模块）
    ├── spring-ai-alibaba-comprehensive-example/
    ├── spring-ai-alibaba-scene-example/
    │   └── multi-model-chat/
    ├── spring-ai-alibaba-translate-example/
    ├── spring-ai-alibaba-text-summarizer-example/
    ├── spring-ai-alibaba-text-classification-example/
    ├── spring-ai-alibaba-classification-grading-example/
    └── spring-ai-alibaba-sql-example/
```

#### 其他目录

```
├── docker-compose/                            # Docker Compose 配置
├── tools/                                     # 工具脚本
├── logs/                                      # 日志目录
└── spring-ai-alibaba-studio-example/          # Studio 示例（非独立模块）
```

---

## 📚 Examples 模块分类

### 一、基础入门类（3个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **helloworld** | 快速开始，基础对话、流式响应、对话记忆 | ⭐⭐⭐⭐⭐ |
| **chat-example** | 多模型对话示例（DashScope、DeepSeek、OpenAI等） | ⭐⭐⭐⭐⭐ |
| **chat-memory-example** | 对话记忆管理示例 | ⭐⭐⭐⭐ |

### 二、Agent 框架类（2个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **agent-example** | ReactAgent、多智能体、A2A 示例 | ⭐⭐⭐⭐⭐ |
| **graph-example** | Graph 工作流编排示例（17个子模块） | ⭐⭐⭐⭐ |

### 三、工具和集成类（4个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **tool-calling-example** | 工具调用示例（4种方式） | ⭐⭐⭐⭐⭐ |
| **mcp-example** | MCP 协议示例（6个子模块） | ⭐⭐⭐⭐ |
| **structured-example** | 结构化输出示例 | ⭐⭐⭐⭐ |
| **prompt-example** | Prompt 管理示例 | ⭐⭐⭐ |

### 四、RAG 和检索类（1个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **rag-example** | RAG 完整示例（多个子模块） | ⭐⭐⭐⭐⭐ |

### 五、多模态类（3个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **multi-model-example** | 多模态处理示例 | ⭐⭐⭐ |
| **image-example** | 图像生成示例 | ⭐⭐⭐ |
| **audio-example** | 音频处理示例 | ⭐⭐⭐ |
| **video-example** | 视频处理示例 | ⭐⭐⭐ |

### 六、企业级功能类（4个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **nacos-prompt-example** | Nacos 配置中心集成 | ⭐⭐⭐⭐ |
| **observability-example** | 可观测性（Zipkin、Langfuse等） | ⭐⭐⭐⭐ |
| **evaluation-example** | Agent 评估示例 | ⭐⭐⭐ |
| **mem0-example** | Mem0 记忆管理 | ⭐⭐⭐ |

### 七、实际用例类（3个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **usecase-example** | 实际业务场景示例 | ⭐⭐⭐⭐ |
| **nl2sql-example** | 自然语言转SQL示例 | ⭐⭐⭐⭐ |
| **more-platform-and-model-example** | 更多平台和模型集成 | ⭐⭐⭐ |

### 八、综合平台类（2个）

| 模块 | 说明 | 学习优先级 |
|------|------|-----------|
| **playground** | 综合演示平台 | ⭐⭐⭐ |
| **studio-example** | Studio 集成示例 | ⭐⭐⭐ |
| **bailian-example** | 百炼平台示例 | ⭐⭐⭐ |

---

## 📖 详细模块说明

### 1. spring-ai-alibaba-helloworld ⭐⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-helloworld`

**功能**: 快速开始示例，展示 Spring AI Alibaba 的基础用法

**核心内容**:
- ✅ 基础对话（ChatClient）
- ✅ 流式响应（SSE）
- ✅ 对话记忆（Advisor + Memory）
- ✅ 自定义 Advisor

**接口**:
- `GET /helloworld/simple/chat` - 简单对话
- `GET /helloworld/stream/chat` - 流式对话
- `GET /helloworld/advisor/chat/{conversationId}` - 带记忆的对话
- `GET /helloworld/advisor/newChat` - 新对话接口

**学习重点**:
- ChatClient 基础使用
- 流式输出实现
- 对话记忆管理
- Advisor 链式调用

**对应学习文档**: `study/文档/quick-start.md`

---

### 2. spring-ai-alibaba-chat-example ⭐⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-chat-example`

**功能**: 多模型对话示例，展示不同 ChatModel 的使用

**子模块**:
- `dashscope-chat/` - DashScope 对话
- `deepseek-chat/` - DeepSeek 对话
- `openai-chat/` - OpenAI 对话
- `azure-openai-chat/` - Azure OpenAI 对话
- `ollama-chat/` - Ollama 对话
- `moonshot-chat/` - Moonshot 对话
- `zhipuai-chat/` - 智谱AI 对话
- `qwq-chat/` - QWQ 对话
- `vllm-chat/` - VLLM 对话

**核心内容**:
- ✅ 多种 ChatModel 集成
- ✅ ChatModel vs ChatClient 对比
- ✅ 流式调用
- ✅ 自定义参数配置
- ✅ 图片分析（DashScope）

**学习重点**:
- 不同模型的配置方式
- ChatModel 和 ChatClient 的区别
- 模型参数自定义
- 多模态输入（图片）

**对应学习文档**: `study/生态集成/chatmodels/`

---

### 3. spring-ai-alibaba-agent-example ⭐⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-agent-example`

**功能**: Agent 框架完整示例

**子模块**:
- `react-agent-example/` - ReactAgent 基础示例
- `playground-flight-booking/` - 航班预订场景示例
- `a2a-server-example/` - A2A 服务器示例
- `a2a-client-example/` - A2A 客户端示例

**核心内容**:
- ✅ ReactAgent 创建和使用
- ✅ 工具调用集成
- ✅ 多智能体系统
- ✅ A2A（Agent-to-Agent）通信
- ✅ 实际业务场景（航班预订）

**学习重点**:
- ReactAgent 完整实现
- 工具定义和调用
- 多智能体协调
- A2A 分布式通信

**对应学习文档**: `study/文档/agent-framework/`

---

### 4. spring-ai-alibaba-graph-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-graph-example`

**功能**: Graph 工作流编排示例

**子模块**（17个）:
- `react/` - React 模式
- `chatflow/` - 对话流
- `stream-node/` - 流式节点
- `parallel-node/` - 并行节点
- `parallel-stream-node/` - 并行流式节点
- `human-node/` - 人工节点
- `mcp-node/` - MCP 节点
- `big-tool/` - 大工具示例
- `reflection/` - 反思模式
- `multiagent-openmanus/` - 多智能体 OpenManus
- `product-analysis-graph/` - 产品分析图
- `usecase-field-classifier/` - 字段分类器
- `workflow-review-classifier/` - 工作流审查分类器
- `workflow-writing-assistant/` - 工作流写作助手
- `issue-clarify-graph-example/` - 问题澄清图
- `interruptable-action-example/` - 可中断操作
- `graph-observability-langfuse/` - Graph 可观测性（Langfuse）

**核心内容**:
- ✅ Graph 基础概念
- ✅ 节点定义和连接
- ✅ 状态管理
- ✅ 并行执行
- ✅ 流式输出
- ✅ 人工介入
- ✅ MCP 集成
- ✅ 复杂工作流编排

**学习重点**:
- Graph API 使用
- 节点类型和特性
- 状态持久化
- 并行和流式处理
- 复杂工作流设计

**对应学习文档**: `study/文档/graph-core/`

---

### 5. spring-ai-alibaba-rag-example ⭐⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-rag-example`

**功能**: RAG（检索增强生成）完整示例

**子模块**（15个）:
- `module-rag/` - 模块化 RAG
- `rag-etl-pipeline-example/` - RAG ETL 管道
- `rag-pgvector-example/` - PGvector 向量数据库
- `rag-milvus-example/` - Milvus 向量数据库
- `rag-elasticsearch-example/` - Elasticsearch 向量数据库
- `rag-openai-dashscope-pgvector-example/` - 多模型 PGvector
- `rag-component-example/` - RAG 组件示例
- `rag-elasticsearch-autoconfigure-example/` - ES 自动配置
- `bailian-rag-knowledge/` - 百炼知识库
- `bailian-agent/` - 百炼 Agent
- `web-search/` - 网络搜索
- `spring-ai-alibaba-vector-databases-example/` - 向量数据库容器（5个子模块）
  - `vector-simple-example/` - 简单向量数据库
  - `vector-redis-example/` - Redis 向量数据库
  - `vector-neo4j-example/` - Neo4j 向量数据库
  - `vector-oceanbase-example/` - OceanBase 向量数据库
  - `vector-opensearch-example/` - OpenSearch 向量数据库

**核心内容**:
- ✅ 模块化 RAG 架构
- ✅ 文档处理和向量化
- ✅ 多种向量数据库集成
- ✅ ETL 管道
- ✅ 网络搜索集成
- ✅ 百炼知识库集成

**学习重点**:
- RAG 完整流程
- 文档读取和解析
- Embeddings 生成
- 向量数据库选择和使用
- 检索策略优化

**对应学习文档**: `study/生态集成/rag/`

---

### 6. spring-ai-alibaba-mcp-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-mcp-example`

**功能**: MCP（Model Context Protocol）完整示例

**子模块**（22个）:
- `spring-ai-alibaba-mcp-starter-example/` - 快速入门（10个子模块）
  - `server/mcp-annotation-server/` - 注解式服务端
  - `server/mcp-stdio-server-example/` - STDIO 服务端
  - `server/mcp-webflux-server-example/` - WebFlux 服务端
  - `server/mcp-streamable-webflux-server/` - Streamable WebFlux 服务端
  - `server/mcp-streamable-webmvc-server/` - Streamable WebMVC 服务端
  - `client/mcp-annotation-client/` - 注解式客户端
  - `client/mcp-stdio-client-example/` - STDIO 客户端
  - `client/mcp-webflux-client-example/` - WebFlux 客户端
  - `client/mcp-streamable-webflux-client/` - Streamable WebFlux 客户端
  - `client/mcp-sdk-streamable-client-example/` - SDK Streamable 客户端
- `spring-ai-alibaba-mcp-manual-example/` - 手动配置（4个子模块）
  - `ai-mcp-fileserver/` - 文件服务器
  - `ai-mcp-github/` - GitHub 集成
  - `sqlite/ai-mcp-sqlite/` - SQLite 集成
  - `sqlite/ai-mcp-sqlite-chatbot/` - SQLite 聊天机器人
- `spring-ai-alibaba-mcp-build-example/` - 自定义构建（1个子模块）
  - `starter-stock-server/` - 股票服务器
- `spring-ai-alibaba-mcp-nacos-example/` - Nacos 服务注册发现（3个子模块）
  - `server/mcp-nacos-register-extensions-example/` - Nacos 注册扩展
  - `server/mcp-nacos-gateway-example/` - Nacos 网关
  - `client/mcp-nacos-distributed-extensions-example/` - Nacos 分布式扩展
- `spring-ai-alibaba-mcp-auth-example/` - 认证授权（2个子模块）
  - `server/mcp-auth-web-server/` - 认证 Web 服务器
  - `client/mcp-auth-client/` - 认证客户端
- `spring-ai-alibaba-mcp-config-example/` - 配置管理（1个子模块）

**核心内容**:
- ✅ MCP 协议基础
- ✅ 注解驱动开发（@Tool, @ToolParam, @McpTool）
- ✅ 多传输协议（WebFlux、STDIO、Streamable HTTP）
- ✅ 服务注册发现（Nacos）
- ✅ 认证授权集成
- ✅ 多源配置管理

**学习重点**:
- MCP 协议理解
- 注解式工具定义
- 不同传输协议选择
- 企业级集成模式

**对应学习文档**: `study/生态集成/mcps/`

---

### 7. spring-ai-alibaba-tool-calling-example ⭐⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-tool-calling-example`

**功能**: 工具调用示例，展示 4 种工具定义方式

**核心内容**:
- ✅ **Methods as Tools** - 方法作为工具
- ✅ **MethodToolCallback** - 方法工具回调
- ✅ **Function as Tools - Function Name** - 函数作为工具（函数名）
- ✅ **FunctionToolCallback** - 函数工具回调

**示例控制器**:
- `TimeController` - 时间工具（Methods as Tools）
- `AddressController` - 地址工具（MethodToolCallback）
- `BaiduTranslateController` - 百度翻译（Function Name）
- `WeatherController` - 天气工具（FunctionToolCallback）

**学习重点**:
- 4 种工具定义方式对比
- 工具参数定义
- 工具上下文使用
- 第三方 API 集成

**对应学习文档**: `study/文档/agent-framework/tutorials/agent-framework-tutorials-tools.md`

---

### 8. spring-ai-alibaba-structured-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-structured-example`

**功能**: 结构化输出示例

**核心内容**:
- ✅ JSON 格式输出
- ✅ Bean 对象输出
- ✅ Map/List 输出
- ✅ 自定义格式输出

**示例控制器**:
- `JsonController` - JSON 输出
- `BeanController` - Bean 对象输出
- `MapListController` - Map/List 输出

**学习重点**:
- `outputType()` 使用
- `outputSchema()` 使用
- 不同数据类型的结构化输出
- JSON Schema 生成

**对应学习文档**: `study/文档/agent-framework/tutorials/agent-framework-tutorials-structured-output.md`

---

### 9. spring-ai-alibaba-chat-memory-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-chat-memory-example`

**功能**: 对话记忆管理示例

**核心内容**:
- ✅ MemorySaver 使用
- ✅ ThreadId 管理
- ✅ 多轮对话上下文
- ✅ 对话历史查询

**学习重点**:
- 对话记忆实现
- ThreadId 生成和管理
- 上下文维护
- 记忆持久化

**对应学习文档**: `study/文档/agent-framework/tutorials/agent-framework-tutorials-memory.md`

---

### 10. spring-ai-alibaba-multi-model-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-multi-model-example`

**功能**: 多模态处理示例

**子模块**:
- `dashscope-multi-model/` - DashScope 多模态
- `openai-dashscope-multi-model/` - OpenAI + DashScope 多模态
- `ark-multi-model/` - ARK 多模态

**核心内容**:
- ✅ 文本 + 图像输入
- ✅ 多模态模型调用
- ✅ 图像理解
- ✅ 跨模型多模态

**学习重点**:
- 多模态输入处理
- 图像理解能力
- 多模型组合使用

**对应学习文档**: `study/生态集成/multimodals/`

---

### 11. spring-ai-alibaba-image-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-image-example`

**功能**: 图像生成示例

**子模块**:
- `dashscope-image/` - DashScope 图像生成
- `openai-image/` - OpenAI 图像生成

**核心内容**:
- ✅ 图像生成 API
- ✅ 图像参数配置
- ✅ 图像下载和保存

**学习重点**:
- ImageClient 使用
- 图像生成参数
- 图像处理流程

**对应学习文档**: `study/生态集成/multimodals/image/`

---

### 12. spring-ai-alibaba-audio-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-audio-example`

**功能**: 音频处理示例

**子模块**:
- `dashscope-audio/` - DashScope 音频处理

**核心内容**:
- ✅ 文本转语音（TTS）
- ✅ 语音转文本（STT）
- ✅ 音频流处理

**学习重点**:
- AudioClient 使用
- TTS/STT 实现
- 音频流处理

**对应学习文档**: `study/生态集成/multimodals/audio/`

---

### 13. spring-ai-alibaba-video-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-video-example`

**功能**: 视频处理示例

**子模块**:
- `dashscope-video/` - DashScope 视频处理

**核心内容**:
- ✅ 视频理解
- ✅ 视频分析
- ✅ 视频生成

**学习重点**:
- 视频处理 API
- 视频分析能力

**对应学习文档**: `study/生态集成/`（待补充）

---

### 14. spring-ai-alibaba-prompt-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-prompt-example`

**功能**: Prompt 管理示例

**核心内容**:
- ✅ Prompt 模板管理
- ✅ Prompt 版本控制
- ✅ Prompt 动态加载

**学习重点**:
- Prompt 工程最佳实践
- Prompt 模板系统
- Prompt 版本管理

---

### 15. spring-ai-alibaba-nacos-prompt-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-nacos-prompt-example`

**功能**: Nacos 配置中心 Prompt 管理

**核心内容**:
- ✅ Nacos 配置中心集成
- ✅ Prompt 动态更新
- ✅ 配置热加载
- ✅ 多环境配置

**学习重点**:
- Nacos 集成方式
- 配置中心使用
- 动态配置更新

**对应学习文档**: `study/生态集成/mcps/nacos/`

---

### 16. spring-ai-alibaba-observability-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-observability-example`

**功能**: 可观测性示例

**子模块**:
- `observability-example/` - 基础可观测性（Zipkin）
- `observability-arms-example/` - ARMS 可观测性
- `observability-langfuse-example/` - Langfuse 可观测性
- `observationhandler-example/` - 自定义 ObservationHandler

**核心内容**:
- ✅ Zipkin 集成
- ✅ ARMS 集成
- ✅ Langfuse 集成
- ✅ 自定义观测处理器
- ✅ Trace 追踪
- ✅ Metrics 指标
- ✅ Logs 日志

**学习重点**:
- 可观测性配置
- Trace 追踪实现
- 自定义观测扩展
- 多平台集成

**对应学习文档**: `study/生态集成/`（待补充）

---

### 17. spring-ai-alibaba-evaluation-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-evaluation-example`

**功能**: Agent 评估示例

**核心内容**:
- ✅ 评估器配置
- ✅ 评估数据集
- ✅ 评估结果分析
- ✅ 评估报告生成

**学习重点**:
- Agent 评估方法
- 评估器实现
- 评估流程

---

### 18. spring-ai-alibaba-nl2sql-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-nl2sql-example`

**功能**: 自然语言转 SQL 示例

**子模块**:
- `chat/` - 对话式 NL2SQL
- `mcp/` - MCP 方式 NL2SQL
- `vector-management/` - 向量管理

**核心内容**:
- ✅ 自然语言转 SQL
- ✅ 数据库 Schema 理解
- ✅ SQL 生成和验证
- ✅ 向量检索增强

**学习重点**:
- NL2SQL 实现
- Schema 理解
- SQL 生成策略
- 向量检索应用

**对应学习文档**: `study/智能体/dataagent/`

---

### 19. spring-ai-alibaba-usecase-example ⭐⭐⭐⭐

**路径**: `/spring-ai-alibaba-usecase-example`

**功能**: 实际业务场景示例

**子模块**（8个）:
- `spring-ai-alibaba-comprehensive-example/` - 综合示例（前端+后端）
- `spring-ai-alibaba-scene-example/multi-model-chat/` - 多模型对话场景
- `spring-ai-alibaba-translate-example/` - 翻译示例
- `spring-ai-alibaba-text-summarizer-example/` - 文本摘要示例
- `spring-ai-alibaba-text-classification-example/` - 文本分类示例
- `spring-ai-alibaba-classification-grading-example/` - 分类分级示例
- `spring-ai-alibaba-sql-example/` - SQL 示例

**核心内容**:
- ✅ 综合应用（前后端完整）
- ✅ 翻译服务
- ✅ 文本摘要
- ✅ 文本分类
- ✅ 采购系统（爬虫+AI分析）
- ✅ 客服系统
- ✅ PDF 处理

**学习重点**:
- 实际业务场景实现
- 前后端集成
- 复杂业务逻辑
- 多模块协作

---

### 20. spring-ai-alibaba-mem0-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-mem0-example`

**功能**: Mem0 记忆管理示例

**核心内容**:
- ✅ Mem0 集成
- ✅ 长期记忆管理
- ✅ 记忆检索
- ✅ 记忆更新

**学习重点**:
- Mem0 使用方式
- 长期记忆实现
- 记忆检索策略

---

### 21. spring-ai-alibaba-more-platform-and-model-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-more-platform-and-model-example`

**功能**: 更多平台和模型集成示例

**核心内容**:
- ✅ 更多 ChatModel 集成
- ✅ 平台特定配置
- ✅ 模型切换策略

**学习重点**:
- 模型集成方式
- 平台配置差异
- 模型选择策略

**对应学习文档**: `study/生态集成/chatmodels/`

---

### 22. spring-ai-alibaba-bailian-example ⭐⭐⭐

**路径**: `/spring-ai-alibaba-bailian-example`

**功能**: 阿里云百炼平台示例

**核心内容**:
- ✅ 百炼平台集成
- ✅ 百炼特定功能
- ✅ 百炼 API 使用

**学习重点**:
- 百炼平台特性
- 百炼 API 调用

---

### 23. spring-ai-alibaba-playground ⭐⭐⭐

**路径**: `/spring-ai-alibaba-playground`

**功能**: 综合演示平台

**核心内容**:
- ✅ 完整的前后端应用
- ✅ 多种功能演示
- ✅ 可视化界面
- ✅ MCP 库集成

**学习重点**:
- 完整应用架构
- 前后端集成
- 功能模块组织

---

### 24. spring-ai-alibaba-studio-example ⚠️

**路径**: `/spring-ai-alibaba-studio-example`

**状态**: 非独立模块（无 pom.xml 或 src 目录）

**说明**: 此目录可能包含配置或文档，但不是独立的工程模块

---

## 🎯 学习路径建议

### 阶段一：基础入门（1-2周）

**目标**: 掌握 Spring AI Alibaba 基础用法

1. **helloworld** ⭐⭐⭐⭐⭐
   - 学习 ChatClient 基础使用
   - 理解流式输出
   - 掌握对话记忆

2. **chat-example** ⭐⭐⭐⭐⭐
   - 学习不同模型的集成方式
   - 理解 ChatModel vs ChatClient
   - 掌握模型参数配置

3. **tool-calling-example** ⭐⭐⭐⭐⭐
   - 学习 4 种工具定义方式
   - 理解工具调用机制
   - 掌握工具参数定义

### 阶段二：Agent 框架（2-3周）

**目标**: 掌握 Agent 框架和多智能体系统

1. **agent-example** ⭐⭐⭐⭐⭐
   - 学习 ReactAgent 实现
   - 理解工具集成
   - 掌握多智能体系统

2. **structured-example** ⭐⭐⭐⭐
   - 学习结构化输出
   - 理解 outputType 和 outputSchema
   - 掌握不同数据类型输出

3. **chat-memory-example** ⭐⭐⭐⭐
   - 学习记忆管理
   - 理解 ThreadId 机制
   - 掌握上下文维护

### 阶段三：Graph 工作流（2-3周）

**目标**: 掌握 Graph 工作流编排

1. **graph-example/react/** ⭐⭐⭐⭐
   - 学习 Graph 基础概念
   - 理解节点定义

2. **graph-example/stream-node/** ⭐⭐⭐⭐
   - 学习流式节点
   - 理解流式处理

3. **graph-example/parallel-node/** ⭐⭐⭐⭐
   - 学习并行执行
   - 理解并行节点

4. **graph-example/human-node/** ⭐⭐⭐⭐
   - 学习人工介入
   - 理解 Human-in-the-Loop

### 阶段四：RAG 和检索（2-3周）

**目标**: 掌握 RAG 完整实现

1. **rag-example/module-rag/** ⭐⭐⭐⭐⭐
   - 学习模块化 RAG
   - 理解 RAG 完整流程

2. **rag-example/rag-pgvector-example/** ⭐⭐⭐⭐
   - 学习 PGvector 集成
   - 理解向量数据库使用

3. **rag-example/rag-etl-pipeline-example/** ⭐⭐⭐⭐
   - 学习 ETL 管道
   - 理解文档处理流程

### 阶段五：企业级功能（2-3周）

**目标**: 掌握企业级集成

1. **mcp-example** ⭐⭐⭐⭐
   - 学习 MCP 协议
   - 理解服务注册发现
   - 掌握认证授权

2. **nacos-prompt-example** ⭐⭐⭐⭐
   - 学习 Nacos 集成
   - 理解配置中心使用

3. **observability-example** ⭐⭐⭐⭐
   - 学习可观测性
   - 理解 Trace 追踪
   - 掌握多平台集成

### 阶段六：实际应用（按需）

**目标**: 学习实际业务场景

1. **usecase-example** ⭐⭐⭐⭐
   - 学习实际业务场景
   - 理解复杂应用架构

2. **nl2sql-example** ⭐⭐⭐⭐
   - 学习 NL2SQL 实现
   - 理解数据库集成

---

## 🔄 与项目对比

### 当前项目已实现功能

| 功能 | 项目状态 | Examples 参考 |
|------|---------|--------------|
| ChatClient 基础对话 | ✅ 已实现 | helloworld |
| Agent 基础功能 | ✅ 已实现 | agent-example/react-agent-example |
| 多智能体系统 | ✅ 已实现 | agent-example |
| 工具调用 | ✅ 已实现 | tool-calling-example |
| 结构化输出 | ✅ 已实现 | structured-example |
| 流式输出 | ✅ 已实现 | helloworld, chat-example |
| 对话记忆 | ⚠️ 部分实现 | chat-memory-example |
| Graph 工作流 | ❌ 未实现 | graph-example |
| RAG | ❌ 未实现 | rag-example |
| MCP | ❌ 未实现 | mcp-example |
| 可观测性 | ❌ 未实现 | observability-example |
| 多模态 | ❌ 未实现 | multi-model-example, image-example |

### 建议学习顺序（基于项目现状）

1. **完善基础功能**（参考 examples）
   - `chat-memory-example` - 完善记忆持久化
   - `tool-calling-example` - 学习更多工具定义方式

2. **实现 Graph 工作流**（参考 examples）
   - `graph-example/react/` - Graph 基础
   - `graph-example/stream-node/` - 流式节点
   - `graph-example/parallel-node/` - 并行节点

3. **实现 RAG**（参考 examples）
   - `rag-example/module-rag/` - 模块化 RAG
   - `rag-example/rag-pgvector-example/` - 向量数据库

4. **企业级集成**（参考 examples）
   - `mcp-example` - MCP 集成
   - `observability-example` - 可观测性
   - `nacos-prompt-example` - 配置中心

---

## 🔍 GitHub 更新检查

### GitHub 仓库信息

- **仓库地址**: https://github.com/spring-ai-alibaba/examples
- **Stars**: 2.2k+
- **Forks**: 953+
- **Commits**: 1,208+
- **最后更新**: 需要定期检查

### 检查更新方法

1. **定期拉取更新**
   ```bash
   cd /Users/rabbit/works/code/github/Repository/spring-ai-alibaba-examples
   git pull origin main
   ```

2. **查看最新提交**
   ```bash
   git log --oneline -10
   ```

3. **对比本地和远程**
   ```bash
   git fetch origin
   git log HEAD..origin/main --oneline
   ```

### 关注重点

- ✅ 新增示例模块
- ✅ 现有模块的功能更新
- ✅ Bug 修复
- ✅ 最佳实践更新
- ✅ 新特性演示

---

## 📝 学习建议

### 1. 按模块学习

- 每个模块都有独立的 README.md
- 建议按照学习路径顺序学习
- 每个模块都要实际运行和测试

### 2. 对比学习

- 对比不同实现方式
- 理解设计模式和最佳实践
- 学习代码组织方式

### 3. 实践应用

- 将 examples 中的代码应用到项目中
- 根据项目需求进行定制
- 记录学习笔记和问题

### 4. 定期更新

- 定期检查 GitHub 更新
- 学习新的示例和最佳实践
- 关注社区讨论和 Issue

---

## 🎓 总结

### Examples 工程价值

1. **完整的学习资源**: 98 个独立模块覆盖所有功能
2. **最佳实践参考**: 官方推荐实现方式
3. **实际场景演示**: 真实业务场景示例
4. **持续更新**: GitHub 定期更新

### 学习建议

1. **从基础开始**: 先学习 helloworld 和 chat-example
2. **循序渐进**: 按照学习路径逐步深入
3. **实践为主**: 每个模块都要实际运行
4. **对比学习**: 对比不同实现方式
5. **定期更新**: 关注 GitHub 最新更新

### 下一步行动

1. ✅ 已完成：总结所有 examples 模块
2. ⏳ 待完成：按照学习路径开始学习
3. ⏳ 待完成：将 examples 中的代码应用到项目
4. ⏳ 待完成：定期检查 GitHub 更新

---

**最后更新**: 2025-01-05

**GitHub 地址**: https://github.com/spring-ai-alibaba/examples

**本地路径**: /Users/rabbit/works/code/github/Repository/spring-ai-alibaba-examples

