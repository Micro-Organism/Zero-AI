# Zero AI Alibaba - Spring AI Alibaba 测试平台

基于 Spring AI Alibaba 框架的智能体测试平台，提供完整的前后端测试界面。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细使用指南](#详细使用指南)
- [测试指南](#测试指南)
- [项目结构](#项目结构)
- [常见问题](#常见问题)
- [参考文档](#参考文档)

---

## 📋 前置要求

1. **JDK 17+** - 确保已安装 Java 17 或更高版本
2. **Maven 3.8+** - 用于构建 Java 项目
3. **Node.js 18+** - 用于构建前端项目
4. **pnpm** - 前端包管理器（推荐使用 pnpm，也可使用 npm）
5. **DashScope API Key** - 阿里云百炼 API Key

### 获取 API Key

访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/?apiKey=1&tab=api#/api) 获取 API Key

---

## 🚀 快速开始

### 第一步：配置后端 API Key

**方式一：环境变量（推荐）**
```bash
export AI_DASHSCOPE_API_KEY=your_api_key_here
```

**方式二：配置文件**
编辑 `src/main/resources/application-dev.yml`：
```yaml
spring:
  ai:
    dashscope:
      api-key: your_api_key_here
      chat:
        options:
          model: qwen-plus
          temperature: 0.7
```

### 第二步：配置前端环境

前端支持多环境配置，根据不同的环境使用不同的配置文件：

- `.env` - 默认配置（所有环境的基础配置）
- `.env.local` - 本地开发配置（不会被版本控制）
- `.env.dev` - 开发环境配置
- `.env.test` - 测试环境配置
- `.env.prod` - 生产环境配置

**环境配置文件位置：** `frontend/.env*`

**配置示例：**
```bash
# frontend/.env.dev
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_API_TIMEOUT=60000
VITE_DEV_PORT=3000
VITE_ENV=dev
```

### 第三步：构建前端（仅首次需要）

```bash
cd frontend
pnpm install

# 根据环境构建
pnpm run build        # 默认构建
pnpm run build:dev    # 开发环境构建
pnpm run build:test   # 测试环境构建
pnpm run build:prod   # 生产环境构建
cd ..
```

**注意：** 如果未安装 pnpm，可以使用 `npm install -g pnpm` 安装，或使用 `npm` 替代 `pnpm`。

### 第四步：启动应用

```bash
mvn spring-boot:run
```

### 第五步：访问测试

打开浏览器访问：`http://localhost:8080`

---

## 📖 详细使用指南

### 方式一：开发模式（前后端分离，推荐用于开发）

#### 步骤 1：启动后端服务

```bash
# 在项目根目录
mvn clean install
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

#### 步骤 2：启动前端开发服务器

打开新的终端窗口：

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
pnpm install

# 启动开发服务器（使用不同环境）
pnpm run dev          # 使用 .env.dev 配置
pnpm run dev:local    # 使用 .env.local 配置
pnpm run dev:test     # 使用 .env.test 配置
```

**注意：** 如果未安装 pnpm，可以使用 `npm install -g pnpm` 安装，或使用 `npm` 替代 `pnpm`。

前端开发服务器将在 `http://localhost:3000` 启动（端口可在环境配置中修改）

#### 步骤 3：访问应用

打开浏览器访问：`http://localhost:3000`

**优势：**
- ✅ 支持热重载，修改代码自动刷新
- ✅ 前后端分离，便于调试
- ✅ 开发体验好

---

### 方式二：生产模式（前后端集成，推荐用于测试）

#### 步骤 1：构建前端

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
pnpm install

# 根据环境构建前端项目
pnpm run build        # 默认构建
pnpm run build:dev    # 开发环境构建
pnpm run build:test   # 测试环境构建
pnpm run build:prod   # 生产环境构建（推荐）
```

**注意：** 如果未安装 pnpm，可以使用 `npm install -g pnpm` 安装，或使用 `npm` 替代 `pnpm`。

构建完成后，静态文件会自动输出到 `src/main/resources/static` 目录

#### 步骤 2：启动 Spring Boot 应用

```bash
# 在项目根目录
mvn spring-boot:run
```

#### 步骤 3：访问应用

打开浏览器访问：`http://localhost:8080`

**优势：**
- ✅ 前后端集成，部署简单
- ✅ 适合生产环境
- ✅ 单一端口访问

---

### 构建说明

#### 开发模式构建

在开发模式下，前端和后端分别运行：

1. 启动 Spring Boot 后端（端口 8080）
2. 在 `frontend` 目录下运行 `pnpm run dev`（端口 3000）
3. Vite 会自动代理 `/api` 请求到后端

#### 生产构建

1. 在 `frontend` 目录下运行：
   ```bash
   pnpm install
   pnpm run build
   ```

2. 构建完成后，静态文件会自动输出到 `src/main/resources/static` 目录

3. 启动 Spring Boot 应用，访问 `http://localhost:8080` 即可使用

#### 构建注意事项

- 构建前确保已安装所有依赖：`pnpm install`
- 如果未安装 pnpm，可以使用 `npm install -g pnpm` 安装，或使用 `npm` 替代
- 构建输出目录已配置为 Spring Boot 的静态资源目录
- 所有前端路由都会由 Vue Router 处理，Spring Boot 只需提供静态文件服务
- 支持多环境构建：`pnpm run build:dev`、`pnpm run build:test`、`pnpm run build:prod`

---

## 🧪 测试指南

### 1. 前端界面测试

#### 测试步骤

1. **访问首页**
   - 打开浏览器访问 `http://localhost:8080`（生产模式）或 `http://localhost:3000`（开发模式）
   - 应该看到欢迎页面和模块卡片

2. **进入 Agent 测试页面**
   - 点击 "Agent 测试" 卡片或顶部菜单的 "Agent 测试"
   - 进入对话测试页面

3. **测试对话功能**
   - 在输入框输入问题，例如：
     - "今天天气怎么样？"
     - "我所在位置的天气如何？"
     - "北京明天会下雨吗？"
   - 点击"发送"按钮或按 Enter 键
   - 等待 Agent 回复

4. **测试对话记忆**
   - 发送第一条消息后，系统会生成 Thread ID
   - 继续发送消息，Agent 会记住之前的对话上下文
   - 例如：先问"今天天气怎么样？"，再问"明天呢？"

5. **测试工具调用**
   - Agent 会自动调用工具（天气查询、位置获取）
   - 观察回复内容，应该包含工具调用的结果

6. **测试清空功能**
   - 点击"清空对话"按钮
   - 对话历史和 Thread ID 会被清除

### 2. 后端 API 测试

#### 使用 curl 测试

```bash
# GET 请求测试
curl "http://localhost:8080/api/agent/chat?message=今天天气怎么样"

# POST 请求测试
curl -X POST "http://localhost:8080/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天天气怎么样？",
    "threadId": "",
    "userId": "1"
  }'
```

#### 使用测试脚本

**Linux/Mac:**
```bash
./test-api.sh
```

**Windows:**
```cmd
test-api.bat
```

#### 使用 Postman 测试

1. 创建新请求
2. 方法：`POST`
3. URL：`http://localhost:8080/api/agent/chat`
4. Headers：`Content-Type: application/json`
5. Body（JSON）：
```json
{
  "message": "今天天气怎么样？",
  "threadId": "",
  "userId": "1"
}
```

### 3. 功能测试清单

- [ ] 首页正常显示
- [ ] 可以点击进入 Agent 测试页面
- [ ] 可以发送消息
- [ ] 可以接收 Agent 回复
- [ ] Thread ID 正确生成和显示
- [ ] 对话记忆功能正常
- [ ] 工具调用功能正常
- [ ] 清空对话功能正常
- [ ] 加载状态显示正常
- [ ] 错误提示正常显示

### 4. 测试用例示例

#### 用例 1：基础天气查询

**输入：** "今天天气怎么样？"

**预期：** Agent 回复包含天气信息，可能调用 `getWeatherForLocation` 工具

#### 用例 2：位置相关查询

**输入：** "我所在位置的天气如何？"

**预期：** Agent 先调用 `getUserLocation` 获取位置，然后调用 `getWeatherForLocation` 获取天气

#### 用例 3：对话记忆

**输入：**
1. "今天天气怎么样？"
2. "明天呢？"

**预期：** 第二条消息中，Agent 应该理解"明天"指的是之前提到的位置

#### 用例 4：多轮对话

**输入：**
1. "你好"
2. "帮我查一下天气"
3. "谢谢"

**预期：** Agent 能够理解上下文，进行连贯的对话

### 5. 常见问题测试

#### 测试网络错误处理

1. 停止后端服务
2. 在前端发送消息
3. 应该显示错误提示

#### 测试空消息处理

1. 尝试发送空消息
2. 发送按钮应该被禁用

#### 测试长消息

1. 发送一条很长的消息
2. 消息应该正常显示和换行

---

## ⚙️ 环境配置说明

### 前端环境变量配置

前端使用 Vite 的环境变量系统，支持多环境配置：

#### 环境文件说明

| 文件 | 说明 | 是否提交到版本控制 |
|------|------|------------------|
| `.env` | 默认配置，所有环境的基础配置 | ✅ 是 |
| `.env.local` | 本地开发配置，覆盖其他配置 | ❌ 否 |
| `.env.dev` | 开发环境配置 | ✅ 是 |
| `.env.test` | 测试环境配置 | ✅ 是 |
| `.env.prod` | 生产环境配置 | ✅ 是 |

#### 环境变量优先级

1. `.env.local`（最高优先级，本地覆盖）
2. `.env.[mode]`（如 `.env.dev`）
3. `.env`（基础配置）

#### 可用的环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | API 基础路径 | `/api` | `/api` |
| `VITE_API_TIMEOUT` | 请求超时时间（毫秒） | `60000` | `60000` |
| `VITE_API_PROXY_TARGET` | 开发模式代理目标 | `http://localhost:8080` | `http://localhost:8080` |
| `VITE_DEV_PORT` | 开发服务器端口 | `3000` | `3000` |
| `VITE_ENV` | 环境标识 | `development` | `dev` / `test` / `prod` |
| `VITE_APP_TITLE` | 应用标题 | `Zero AI Alibaba` | `Zero AI Alibaba` |
| `VITE_APP_DESCRIPTION` | 应用描述 | `Spring AI Alibaba 测试平台` | - |

#### 使用环境变量

在代码中使用环境变量：

```typescript
// 方式一：直接使用 import.meta.env
const apiUrl = import.meta.env.VITE_API_BASE_URL

// 方式二：使用配置模块（推荐）
import { API_BASE_URL, API_TIMEOUT, ENV } from '@/config/env'
```

#### 配置示例

**开发环境（.env.dev）：**
```bash
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_API_TIMEOUT=60000
VITE_DEV_PORT=3000
VITE_ENV=dev
```

**测试环境（.env.test）：**
```bash
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://test-server:8080
VITE_API_TIMEOUT=60000
VITE_ENV=test
```

**生产环境（.env.prod）：**
```bash
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=60000
VITE_ENV=prod
VITE_PROD_OPTIMIZE=true
```

#### 本地配置覆盖

创建 `.env.local` 文件来覆盖其他配置（此文件不会被提交到版本控制）：

```bash
# frontend/.env.local
VITE_API_PROXY_TARGET=http://localhost:9090  # 覆盖默认的后端地址
VITE_DEV_PORT=3001                          # 覆盖默认端口
```

---

## 📁 项目结构

```
zero-ai-alibaba/
├── frontend/                 # 前端项目（Vue3 + TypeScript + Ant Design）
│   ├── src/
│   │   ├── api/              # API 接口
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── views/            # 页面组件
│   │   ├── App.vue           # 根组件
│   │   └── main.ts           # 入口文件
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/sdecloud/springai/alibaba/
│   │   │       ├── common/           # 公共模块
│   │   │       │   ├── config/       # Agent 配置
│   │   │       │   ├── model/        # 数据模型
│   │   │       │   └── tool/         # 工具类
│   │   │       ├── config/            # Web 配置
│   │   │       ├── controller/       # 控制器
│   │   │       ├── service/          # 服务层
│   │   │       └── ZeroAiAlibabaApplication.java
│   │   └── resources/
│   │       ├── application.yml        # 配置文件
│   │       └── static/                # 静态资源（构建后）
│   └── test/                          # 测试代码
├── pom.xml                            # Maven 配置
├── README.md                           # 本文档
└── test-api.sh / test-api.bat         # API 测试脚本
```

---

## 🐛 常见问题

### 1. API Key 未配置

**错误：** `AI_DASHSCOPE_API_KEY` 未设置

**解决：** 配置环境变量或配置文件中的 API Key

### 2. 前端无法连接后端

**错误：** Network Error 或 CORS 错误

**解决：** 
- 确保后端服务已启动（端口 8080）
- 开发模式下，检查 Vite 代理配置

### 3. 构建失败

**错误：** pnpm install 失败

**解决：**
- 检查 Node.js 版本（需要 18+）
- 检查 pnpm 是否已安装：`pnpm --version`
- 如果未安装 pnpm：`npm install -g pnpm` 或使用 `npm` 替代
- 清除缓存：`rm -rf node_modules pnpm-lock.yaml && pnpm install`
- 如果使用 npm：`rm -rf node_modules package-lock.json && npm install`

### 4. 静态资源 404

**错误：** 访问页面显示 404

**解决：**
- 确保已运行 `npm run build`
- 检查 `src/main/resources/static` 目录是否有文件

### 5. Maven 构建问题

**错误：** Maven 依赖下载失败

**解决：**
- 检查网络连接
- 配置 Maven 镜像源
- 清理并重新构建：`mvn clean install`

---

## 🔍 调试技巧

### 查看后端日志

启动 Spring Boot 后，在控制台可以看到：
- Agent 调用日志
- 工具调用日志
- 错误信息

### 查看前端控制台

在浏览器按 F12 打开开发者工具：
- **Console**：查看 JavaScript 错误和日志
- **Network**：查看 API 请求和响应

### 检查 API 响应

在 Network 标签中：
1. 找到 `/api/agent/chat` 请求
2. 查看 Request 和 Response
3. 检查返回的 JSON 数据

---

## 📚 参考文档

### 官方文档

- [Spring AI Alibaba 快速开始](https://java2ai.com/docs/quick-start)
- [Spring Boot 官方文档](https://docs.spring.io/spring-boot/)
- [Maven 官方文档](https://maven.apache.org/guides/index.html)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Ant Design Vue 文档](https://antdv.com/docs/vue/introduce-cn)

### 项目文档

- 前端项目说明：`frontend/README.md`

### 安装 pnpm

如果您的系统未安装 pnpm，可以使用以下方式安装：

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 Homebrew (macOS)
brew install pnpm

# 或使用 curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

安装完成后，可以使用 `pnpm --version` 验证安装。

**注意：** 如果不想安装 pnpm，也可以使用 `npm` 替代所有 `pnpm` 命令。

### 获取 API Key

- [阿里云百炼控制台](https://bailian.console.aliyun.com/?apiKey=1&tab=api#/api)

---

## 🛠️ 技术栈

### 后端

- Spring Boot 3.5.9
- Spring AI Alibaba 1.1.0.0-RC2
- DashScope (阿里云百炼)

### 前端

- Vue 3.4
- TypeScript 5.3
- Vite 5
- Vue Router 4
- Pinia 2
- Ant Design Vue 4
- Axios

---

## 🤖 Agent 输出格式和多智能体系统

### 一、ResponseFormat 生成 JSON 结构的工作原理

#### 1. 核心机制

当你使用 `outputType(ResponseFormat.class)` 时，Spring AI 框架会：

1. **自动分析类结构**：通过反射读取 `ResponseFormat` 类的所有字段
2. **生成 JSON Schema**：根据字段类型自动生成对应的 JSON Schema
3. **约束 LLM 输出**：将生成的 Schema 传递给 LLM，要求 LLM 严格按照这个格式输出

#### 2. 当前 ResponseFormat 结构

```java
@Data
public class ResponseFormat {
    private String punnyResponse;      // 生成字段1
    private String weatherConditions;  // 生成字段2
}
```

**生成的 JSON Schema 类似：**
```json
{
  "type": "object",
  "properties": {
    "punnyResponse": {
      "type": "string"
    },
    "weatherConditions": {
      "type": "string"
    }
  },
  "required": ["punnyResponse", "weatherConditions"]
}
```

#### 3. 为什么生成两个 JSON 节点？

- **punnyResponse**：对应类中的第一个字段
- **weatherConditions**：对应类中的第二个字段

**每个字段都会成为 JSON 的一个属性节点。**

#### 4. 可以定义更多字段吗？

**完全可以！** 你可以在 `ResponseFormat` 中添加任意多个字段：

```java
@Data
public class ResponseFormat {
    private String punnyResponse;
    private String weatherConditions;
    private String temperature;        // 新增字段1
    private String humidity;           // 新增字段2
    private List<String> suggestions;  // 新增字段3（列表类型）
    private Integer windSpeed;        // 新增字段4（数字类型）
    private Boolean isSunny;           // 新增字段5（布尔类型）
}
```

**生成的 JSON 会包含所有这些字段：**
```json
{
  "punnyResponse": "...",
  "weatherConditions": "...",
  "temperature": "...",
  "humidity": "...",
  "suggestions": ["...", "..."],
  "windSpeed": 15,
  "isSunny": true
}
```

#### 5. 支持的数据类型

- `String` → `"type": "string"`
- `Integer` / `int` → `"type": "integer"`
- `Double` / `double` → `"type": "number"`
- `Boolean` / `boolean` → `"type": "boolean"`
- `List<T>` / `Array` → `"type": "array"`
- 自定义类 → 嵌套对象

### 二、多智能体系统实现

#### 1. 多智能体架构模式

Spring AI Alibaba 支持三种多智能体模式：

**模式1：SupervisorAgent（监督者模式）**
- **一个监督者 Agent** 协调多个专业 Agent
- 监督者根据任务类型路由到合适的子 Agent
- 适合：任务需要智能路由和协调的场景

**模式2：SequentialAgent（顺序执行模式）**
- 多个 Agent **按顺序执行**
- 前一个 Agent 的输出作为下一个 Agent 的输入
- 适合：有明确执行顺序的工作流

**模式3：AgentTool（Agent 作为工具）**
- 将 Agent **封装成工具**，供其他 Agent 调用
- 适合：需要动态调用不同 Agent 的场景

#### 2. 实现示例：监督者模式

```java
@Configuration
public class MultiAgentConfig {
    
    // 1. 创建专业 Agent 1：天气查询专家
    @Bean
    public ReactAgent weatherAgent(ChatModel chatModel) {
        return ReactAgent.builder()
                .name("weather_agent")
                .model(chatModel)
                .description("专业的天气查询专家")
                .instruction("你负责查询和提供天气信息。")
                .tools(getWeatherTool())
                .outputType(WeatherResponse.class)  // 自定义输出格式
                .outputKey("weather_output")
                .build();
    }
    
    // 2. 创建专业 Agent 2：位置服务专家
    @Bean
    public ReactAgent locationAgent(ChatModel chatModel) {
        return ReactAgent.builder()
                .name("location_agent")
                .model(chatModel)
                .description("专业的位置服务专家")
                .instruction("你负责获取和处理位置信息。")
                .tools(getLocationTool())
                .outputType(LocationResponse.class)
                .outputKey("location_output")
                .build();
    }
    
    // 3. 创建专业 Agent 3：数据分析专家
    @Bean
    public ReactAgent analysisAgent(ChatModel chatModel) {
        return ReactAgent.builder()
                .name("analysis_agent")
                .model(chatModel)
                .description("专业的数据分析专家")
                .instruction("你负责分析和处理数据。")
                .outputType(AnalysisResponse.class)
                .outputKey("analysis_output")
                .build();
    }
    
    // 4. 创建监督者 Agent
    @Bean
    public SupervisorAgent supervisorAgent(
            ChatModel chatModel,
            ReactAgent weatherAgent,
            ReactAgent locationAgent,
            ReactAgent analysisAgent) {
        
        String supervisorPrompt = """
            你是一个智能任务协调者，负责将用户请求路由到合适的专业Agent。
            
            ## 可用的子Agent
            
            ### weather_agent
            - 功能：查询天气信息
            - 适用：用户询问天气、温度、降雨等
            
            ### location_agent
            - 功能：获取和处理位置信息
            - 适用：用户询问位置、地址、地理信息等
            
            ### analysis_agent
            - 功能：数据分析和处理
            - 适用：用户需要数据分析、统计、报告等
            
            ## 决策规则
            1. 分析用户请求，判断任务类型
            2. 选择最合适的Agent处理
            3. 如果任务完成，返回 FINISH
            
            ## 响应格式
            只返回Agent名称（weather_agent、location_agent、analysis_agent）或FINISH。
            """;
        
        return SupervisorAgent.builder()
                .name("supervisor")
                .model(chatModel)
                .systemPrompt(supervisorPrompt)
                .subAgents(List.of(weatherAgent, locationAgent, analysisAgent))
                .build();
    }
}
```

#### 3. 实现示例：顺序执行模式

```java
@Bean
public SequentialAgent workflowAgent(
        ChatModel chatModel,
        ReactAgent step1Agent,
        ReactAgent step2Agent,
        ReactAgent step3Agent) {
    
    return SequentialAgent.builder()
            .name("workflow_agent")
            .description("多步骤工作流")
            .subAgents(List.of(step1Agent, step2Agent, step3Agent))
            .build();
}
```

#### 4. 实现示例：Agent 作为工具

```java
@Bean
public ReactAgent coordinatorAgent(
        ChatModel chatModel,
        ReactAgent weatherAgent,
        ReactAgent locationAgent) {
    
    // 将其他 Agent 封装成工具
    ToolCallback weatherTool = AgentTool.getFunctionToolCallback(weatherAgent);
    ToolCallback locationTool = AgentTool.getFunctionToolCallback(locationAgent);
    
    return ReactAgent.builder()
            .name("coordinator")
            .model(chatModel)
            .instruction("你可以调用天气和位置工具来完成用户请求。")
            .tools(weatherTool, locationTool)
            .build();
}
```

### 三、扩展 ResponseFormat 的完整示例

#### 1. 扩展字段定义

```java
package com.sdecloud.springai.alibaba.common.model;

import lombok.Data;
import java.util.List;

@Data
public class EnhancedResponseFormat {
    // 原有字段
    private String punnyResponse;
    private String weatherConditions;
    
    // 新增字段
    private String temperature;           // 温度
    private String humidity;              // 湿度
    private String windSpeed;             // 风速
    private String windDirection;        // 风向
    private List<String> suggestions;     // 建议列表
    private WeatherDetail detail;         // 嵌套对象
    private Boolean isExtreme;           // 是否极端天气
}

@Data
class WeatherDetail {
    private String currentCondition;
    private String forecast;
    private Integer visibility;
}
```

#### 2. 使用扩展格式

```java
@Bean
public ReactAgent enhancedWeatherAgent(ChatModel chatModel) {
    return ReactAgent.builder()
            .name("enhanced_weather_agent")
            .model(chatModel)
            .systemPrompt("你是一个专业的天气预报专家...")
            .tools(getWeatherTool())
            .outputType(EnhancedResponseFormat.class)  // 使用扩展格式
            .build();
}
```

#### 3. 生成的 JSON 示例

```json
{
  "punnyResponse": "今天天气真好，阳光明媚！",
  "weatherConditions": "晴天，温度适宜",
  "temperature": "25°C",
  "humidity": "60%",
  "windSpeed": "15 km/h",
  "windDirection": "东北风",
  "suggestions": [
    "适合户外活动",
    "建议携带防晒用品"
  ],
  "detail": {
    "currentCondition": "晴朗",
    "forecast": "未来三天持续晴天",
    "visibility": 10
  },
  "isExtreme": false
}
```

### 四、最佳实践

#### 1. 字段命名建议
- 使用清晰的驼峰命名：`weatherConditions` 而不是 `wc`
- 添加注释说明字段用途
- 考虑使用枚举类型限制可选值

#### 2. 输出格式设计
- **简单任务**：使用基本类型（String, Integer）
- **复杂任务**：使用嵌套对象组织数据
- **列表数据**：使用 `List<T>` 类型

#### 3. 多智能体设计
- **职责分离**：每个 Agent 专注一个领域
- **清晰路由**：监督者要有明确的决策规则
- **输出规范**：使用 `outputType` 统一输出格式

### 五、总结

1. **ResponseFormat 机制**：
   - 通过反射自动生成 JSON Schema
   - 每个字段对应一个 JSON 属性
   - 可以定义任意多个字段和类型

2. **多智能体实现**：
   - SupervisorAgent：智能路由和协调
   - SequentialAgent：顺序执行工作流
   - AgentTool：动态调用其他 Agent

3. **扩展性**：
   - 可以随时添加新字段
   - 支持复杂嵌套结构
   - 支持多种数据类型

---

## 📝 许可证

本项目基于 Spring AI Alibaba 框架开发。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新：** 2025-12-31

