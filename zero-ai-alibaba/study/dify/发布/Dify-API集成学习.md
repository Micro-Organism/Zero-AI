# Dify API 集成学习

> 学习来源：https://docs.dify.ai/zh/use-dify/publish/developing-with-apis

## 一、API 集成概述

### 1.1 为什么使用 Dify API

- **跳过后端复杂性**：直接从前端应用访问大型语言模型能力，无需管理 AI 基础设施
- **可视化应用管理**：可视化设计和更新 AI 行为——更改会立即同步到所有 API 消费者
- **提供商灵活性**：在 AI 提供商之间切换并集中管理 API 密钥，无需更改代码
- **内置监控**：开箱即用的日志、分析和用户活动跟踪

### 1.2 API 集成的工作原理

1. **构建应用**：在 Dify Studio 中构建具有所需 AI 能力的应用
2. **生成 API 凭据**：安全访问应用功能
3. **调用 API**：从你的应用程序调用 API 获取 AI 驱动的响应
4. **用户交互**：用户通过你的自定义界面交互，而 Dify 处理 AI 处理过程

**重要说明**：你的 API 会自动继承 Dify 应用的所有功能——提示词、知识库、工具和模型配置。

## 二、开始使用

### 2.1 步骤

1. **访问 API 设置**：在你的应用中，导航至左侧边栏的 **API Access**
2. **创建 API 凭据**：为你的集成生成新凭据。你可以为不同环境或用户创建多个密钥
3. **查看文档**：Dify 会生成针对你应用配置的完整 API 文档
4. **在应用中实现**：使用提供的示例将 API 调用集成到你的应用程序中

### 2.2 API 安全

**凭据管理**：
- 为开发、测试和生产环境创建独立的 API 密钥
- 定期轮换密钥并撤销未使用的凭据
- 监控 API 使用情况以检测异常活动

**最佳实践**：
- 在后端将 API 密钥存储为环境变量
- 在你这边实施速率限制以防止过度使用
- 在转发到 Dify API 之前添加请求验证
- 记录 API 调用以便调试和监控

**警告**：永远不要在前端代码或客户端请求中暴露 API 密钥。始终从后端调用 Dify API 以防止滥用并维护安全性。

## 三、API 接口

### 3.1 文本生成应用

**接口**：`POST /v1/completion-messages`

**说明**：这些应用程序用于生成高质量文本，如文送用户输入来获得生成的文本结果。用于生成文本的模型参数和提示词模板取决于开发者在 Dify 提示词编排页面中的设置。

**示例请求**：
```bash
curl --location --request POST 'https://api.dify.ai/v1/completion-messages' \
--header 'Authorization: Bearer ENTER-YOUR-SECRET-KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'
```

**参数说明**：
- `inputs`: 输入变量（对象）
- `response_mode`: 响应模式（"blocking" 或 "streaming"）
- `user`: 用户标识符

### 3.2 对话应用

**接口**：`POST /v1/chat-messages`

**说明**：对话应用通过问答格式促进与用户的持续对话。要启动对话，你需要调用 `chat-messages` API。每个会话都会生成一个 `conversation_id`，必须在后续 API 调用中包含此 ID 以维持对话流。

**重要说明**：服务 API 不会共享 WebApp 创建的对话。通过 API 创建的对话与在 WebApp 界面中创建的对话是隔离的。

**conversation_id 的关键注意事项**：

1. **生成 conversation_id**：
   - 开始新对话时，将 `conversation_id` 字段留空
   - 系统将生成并返回新的 `conversation_id`，你将在未来的交互中使用此 ID 继续对话

2. **在现有会话中处理 conversation_id**：
   - 一旦生成 `conversation_id`，对 API 的后续调用应包含此 `conversation_id` 以确保与 Dify 机器人的对话连续性
   - 当传递之前的 `conversation_id` 时，任何新的 `inputs` 将被忽略。只有 `query` 会为正在进行的对话进行处理

3. **管理动态变量**：
   - 如果需要在会话期间修改逻辑或变量，你可以使用会话变量（特定于会话的变量）来调整机器人的行为或响应

**示例请求**：
```bash
curl --location --request POST 'https://api.dify.ai/v1/chat-messages' \
--header 'Authorization: Bearer ENTER-YOUR-SECRET-KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "query": "eh",
  "response_mode": "streaming",
  "conversation_id": "1c7e55fb-1ba2-4e10-81b5-30addcea2276",
  "user": "abc-123"
}'
```

**参数说明**：
- `inputs`: 输入变量（对象）
- `query`: 用户查询内容
- `response_mode`: 响应模式（"blocking" 或 "streaming"）
- `conversation_id`: 对话ID（可选，新对话时留空）
- `user`: 用户标识符

## 四、关键发现

### 4.1 工具列表获取

**重要发现**：
- Dify **没有**提供 `/v1/tools` 接口来获取全局工具列表
- 工具信息是**应用级别的**，需要从应用详情中获取
- 工具配置包含在应用的配置中，通过 `/console/api/apps/{appId}` 或应用详情接口获取

### 4.2 应用详情接口

根据实际使用情况，获取应用详情和工具配置应该使用：
- **Console API**：`GET /console/api/apps/{appId}` - 管理接口，返回完整的应用配置
- **V1 API**：`GET /v1/apps/{appId}` - 公开API接口（如果支持）

### 4.3 工具配置位置

工具配置可能位于应用详情的以下字段中：
- `tool_configurations` - 工具配置列表
- `model_config.tools` - 模型配置中的工具列表
- `agent_config.tools` - Agent配置中的工具列表（对于Agent类型应用）
- `tools` - 直接的工具列表

## 五、实现建议

### 5.1 获取工具列表的正确方式

1. **必须提供 appId**：工具列表是应用级别的，必须指定应用ID
2. **优先使用 Console API**：`/console/api/apps/{appId}` 返回更完整的应用配置
3. **递归搜索工具配置**：工具配置可能嵌套在不同字段中，需要递归搜索
4. **格式化工具信息**：将不同格式的工具配置统一为标准的工具列表格式

### 5.2 错误处理

- 当没有提供 appId 时，应该返回明确的错误提示，而不是尝试调用不存在的 `/v1/tools` 接口
- 当应用不存在或没有工具配置时，返回空列表并记录日志

## 六、总结

1. Dify API 主要通过 `/v1/completion-messages` 和 `/v1/chat-messages` 提供应用功能
2. **不存在** `/v1/tools` 全局工具列表接口
3. 工具信息需要从**应用详情**中获取，必须提供 `appId`
4. 使用 `/console/api/apps/{appId}` 获取完整的应用配置，包括工具信息
5. 工具配置可能嵌套在多个字段中，需要递归搜索和格式化

