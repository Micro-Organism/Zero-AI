# Dify 起步指南

## 一、Dify 简介

Dify 是一个开源的 LLM 应用开发平台，提供了可视化的应用编排能力，支持多种发布方式。

## 二、核心概念

### 2.1 应用（App）

- Dify 中的核心概念，每个应用代表一个独立的 AI 应用
- 应用可以是聊天应用、文本生成应用、工作流应用等
- 每个应用都有唯一的应用ID（appId），格式为 UUID

### 2.2 工具（Tools）

- 工具是应用中可以调用的功能模块
- 工具信息是应用级别的，不是全局的
- 必须提供 appId 才能获取应用的工具列表

### 2.3 API 认证

Dify 支持两种认证方式：
1. **API Key**：Bearer Token 认证，适用于 API 调用
2. **Basic Auth**：用户名密码认证，适用于管理接口

**重要说明**：
- **Console API** (`/console/api/*`) 只支持 Bearer Token（API Key）认证，不支持 Basic Auth
- **V1 API** (`/v1/*`) 支持 Bearer Token（API Key）认证
- 如果使用 Console API，必须提供有效的 API Key

## 三、配置说明

### 3.1 配置文件

在 `application-dev.yml` 中配置 Dify 相关参数：

```yaml
dify:
    api:
        url: http://10.133.0.147:18082
        key: ${DIFY_API_KEY:app-k1Yo4DhPXSj5VXU6gbsSjbPQ}
        username: ${DIFY_USERNAME:1746535582@qq.com}
        password: ${DIFY_API_PASSWORD:cyyai_6tfc^YHN}
```

### 3.2 配置说明

- **url**：Dify 服务地址
- **key**：API Key，优先使用环境变量 `DIFY_API_KEY`，否则使用默认值
- **username**：用户名，优先使用环境变量 `DIFY_USERNAME`，否则使用默认值
- **password**：密码，优先使用环境变量 `DIFY_PASSWORD`，否则使用默认值

### 3.3 配置要求

**重要**：必须至少配置以下之一：
1. `dify.api.key`（API Key）- **推荐用于 Console API**
2. `dify.api.username` 和 `dify.api.password`（Basic Auth）- 仅适用于 V1 API

如果两者都未配置，系统会抛出明确的错误提示，要求提供配置。

## 四、如何获取必要参数

### 4.1 获取应用ID（appId）

**方法1：从浏览器地址栏**
1. 登录 Dify：访问 http://10.133.0.147:18082
2. 进入应用：点击左侧导航栏的"工作室"或"应用"
3. 选择应用：点击你想要使用的应用
4. 查看地址栏：URL 格式为 `/app/{appId}/develop`
   - 例如：`http://10.133.0.147:18082/app/c46e6278-529e-4baf-9689-82e36f71ccfd/develop`
   - 应用ID就是：`c46e6278-529e-4baf-9689-82e36f71ccfd`

**方法2：通过 API 获取应用列表**
```bash
GET /api/dify/apps?page=1&limit=30
```
响应中会包含每个应用的 `id` 字段，这就是 `appId`。

### 4.2 获取 API Key

1. **登录 Dify**：访问 http://10.133.0.147:18082
2. **进入应用**：选择你要使用的应用
3. **打开 API 设置**：
   - 点击左侧边栏的"发布"
   - 或点击"API Access"
4. **创建新的 API Key**：
   - 点击"创建 API Key"或"生成新密钥"
   - 复制并保存新的 API Key
   - **注意**：创建后只能查看一次，之后无法再次查看

### 4.3 验证 API Key 是否有效

**方法1：使用测试脚本**

运行项目根目录下的测试脚本：
```bash
cd /Users/rabbit/works/code/github/Micro-Organism/Zero-AI/zero-ai-alibaba
./test-dify-api.sh
```

**方法2：使用 curl 命令**

```bash
curl -X GET "http://10.133.0.147:18082/console/api/apps/c46e6278-529e-4baf-9689-82e36f71ccfd" \
  -H "Authorization: Bearer 你的API密钥" \
  -H "Content-Type: application/json"
```

如果返回 200 和 JSON 数据，说明 API Key 有效。
如果返回 401，说明 API Key 无效或已过期。

## 五、常见问题排查

### 5.1 问题：提示需要提供 appId

**错误信息**：
```
获取工具列表需要提供 appId 参数。Dify 没有全局工具列表接口，工具信息是应用级别的。
```

**原因**：
- 前端没有传递 `app_id` 参数
- 参数值为空字符串

**解决方法**：
1. 检查前端调用时是否传递了 `app_id` 参数
2. 检查浏览器 Network 面板，查看实际请求的 URL
3. 查看后端日志，确认接收到的参数值

### 5.2 问题：认证配置缺失

**错误信息**：
```
Dify 认证配置缺失。必须提供以下配置之一：1) dify.api.key (API Key) 或 2) dify.api.username 和 dify.api.password (Basic Auth)。请检查 application-dev.yml 或环境变量配置。
```

**原因**：
- `dify.api.key` 未配置或为空
- `dify.api.username` 和 `dify.api.password` 未配置或为空

**解决方法**：
1. 检查 `application-dev.yml` 中的配置
2. 检查环境变量是否设置
3. 确保至少配置一种认证方式

### 5.3 问题：API Key 认证失败（401 Invalid token）

**错误信息**：
```
API Key 认证失败 (401): {"code": "unauthorized", "message": "Invalid token.", "status": 401}。请检查 dify.api.key 配置是否正确，或该 API Key 是否已过期。
```

**原因**：
- API Key 无效或已过期
- API Key 被撤销
- API Key 配置错误

**解决方法**：
1. **运行测试脚本验证**：
   ```bash
   ./test-dify-api.sh
   ```
   查看返回的 HTTP 状态码，如果是 401，说明 API Key 无效。

2. **在 Dify 中重新生成 API Key**：
   - 登录 Dify：http://10.133.0.147:18082
   - 进入应用：选择应用 `c46e6278-529e-4baf-9689-82e36f71ccfd`
   - 打开 API 设置：点击左侧边栏的"发布"或"API Access"
   - 创建新的 API Key：点击"创建 API Key"或"生成新密钥"
   - 复制新的 API Key

3. **更新配置**：
   - 方式1：更新 `application-dev.yml`：
     ```yaml
     dify:
         api:
             key: 你的新API密钥
     ```
   - 方式2：使用环境变量（推荐）：
     ```bash
     export DIFY_API_KEY=你的新API密钥
     ```

4. **重启应用**：确保新的配置生效

### 5.4 问题：Basic Auth 认证失败

**错误信息**：
```
Basic Auth 认证失败, 状态码: 401, 响应: {...}。Console API 可能不支持 Basic Auth，只支持 Bearer Token 认证。请使用有效的 API Key（dify.api.key）。
```

**原因**：
- Console API 不支持 Basic Auth，只支持 Bearer Token（API Key）
- 用户名密码认证仅适用于 V1 API，不适用于 Console API

**解决方法**：
1. **使用 API Key 而不是 Basic Auth**：Console API 必须使用 API Key
2. 如果必须使用用户名密码，只能调用 V1 API，不能调用 Console API

### 5.5 问题：无法获取工具列表

**错误信息**：
```
无法获取应用 {appId} 的工具列表。可能的原因：1) API Key 无效或已过期，请检查 dify.api.key 配置；2) 用户名密码错误，请检查 dify.api.username 和 dify.api.password 配置；3) 应用不存在或未发布；4) 应用确实没有配置工具。请查看日志获取详细错误信息。
```

**原因**：
1. 认证失败（API Key 或 Basic Auth）
2. 应用不存在或未发布
3. 应用确实没有配置工具

**解决方法**：
1. **运行测试脚本**：
   ```bash
   ./test-dify-api.sh
   ```
   查看测试结果，确认 API Key 是否有效。

2. **检查认证配置**：
   - 查看启动日志中的配置信息
   - 确认 API Key 是否正确读取

3. **在 Dify 界面中确认**：
   - 应用存在且已发布
   - 应用确实配置了工具

4. **查看后端日志**：获取详细错误信息

### 5.6 问题：工具列表为空

**可能原因**：
1. 应用确实没有配置工具
2. 工具配置在响应中的位置与预期不符
3. API 认证失败，返回了空数据

**解决方法**：
1. 在 Dify 界面中检查应用的工具配置
2. 查看后端日志中的完整响应结构
3. 检查 API Key 或用户名密码是否正确

## 六、API 接口说明

### 6.1 获取应用列表

**接口**：`GET /api/dify/apps`

**功能**：获取 Dify 工作空间中的所有应用列表

**参数**：
- `page`：页码（可选，默认 1）
- `limit`：每页数量（可选，默认 30）
- `name`：应用名称（可选，用于搜索）

**示例请求**：
```bash
GET /api/dify/apps?page=1&limit=30
GET /api/dify/apps?page=1&limit=30&name=文本生成
```

**响应格式**：
```json
{
  "code": 200,
  "message": "获取应用列表成功",
  "data": [
    {
      "id": "c46e6278-529e-4baf-9689-82e36f71ccfd",
      "name": "文本生成应用测试",
      "mode": "completion",
      "status": "normal",
      ...
    }
  ],
  "page": 1,
  "limit": 30,
  "total": 1
}
```

### 6.2 获取工具列表

**接口**：`GET /api/dify/tools`

**功能**：获取指定应用的工具列表

**参数**：
- `app_id`：应用ID（必填）

**示例请求**：
```bash
GET /api/dify/tools?app_id=c46e6278-529e-4baf-9689-82e36f71ccfd
```

**响应格式**：
```json
{
  "code": 200,
  "message": "获取工具列表成功",
  "data": [
    {
      "id": "tool_id",
      "name": "工具名称",
      "description": "工具描述",
      "parameters": {...},
      "enabled": true
    }
  ]
}
```

**错误响应**：
- 如果未提供 `app_id`：
```json
{
  "code": 400,
  "message": "获取工具列表需要提供 appId 参数。Dify 没有全局工具列表接口，工具信息是应用级别的。",
  "data": null
}
```

- 如果认证失败：
```json
{
  "code": 500,
  "message": "API Key 认证失败 (401): {...}。请检查 dify.api.key 配置是否正确，或该 API Key 是否已过期。",
  "data": null
}
```

## 七、错误处理原则

### 7.1 不隐藏错误

系统遵循"不隐藏错误"的原则：
- 配置缺失时，抛出明确的异常，告诉用户必须提供什么配置
- 认证失败时，返回详细的错误信息，包括状态码和响应内容
- API 调用失败时，返回具体的错误原因，而不是返回空列表

### 7.2 错误信息格式

所有错误信息都包含：
1. **错误类型**：明确说明是什么错误（配置缺失、认证失败、API调用失败等）
2. **错误原因**：详细说明为什么失败
3. **解决方法**：提供具体的解决步骤

### 7.3 日志记录

系统会记录详细的日志，包括：
- 接收到的参数
- 使用的认证方式
- API 请求的 URL
- API 响应的完整结构
- 错误信息和堆栈跟踪

## 八、调试步骤

### 8.1 步骤1：运行测试脚本

运行测试脚本验证 API Key 是否有效：
```bash
cd /Users/rabbit/works/code/github/Micro-Organism/Zero-AI/zero-ai-alibaba
./test-dify-api.sh
```

查看测试结果：
- HTTP状态码 200：API Key 有效
- HTTP状态码 401：API Key 无效或已过期，需要重新生成
- HTTP状态码 404：接口不存在或应用不存在

### 8.2 步骤2：验证应用存在

在浏览器中访问：
```
http://10.133.0.147:18082/app/c46e6278-529e-4baf-9689-82e36f71ccfd/develop
```

### 8.3 步骤3：检查后端日志

查看启动日志，确认配置是否正确加载：
```
Dify 配置加载完成:
  - API URL: http://10.133.0.147:18082
  - API Key: app-xxxxx... (长度: xx)
  - Username: 1746535582@qq.com
  - Password: ***
```

### 8.4 步骤4：检查前端请求

在浏览器开发者工具的 Network 面板中：
1. 找到 `/api/dify/tools` 请求
2. 查看请求 URL 是否包含 `app_id` 参数
3. 查看响应内容

## 九、配置检查清单

在开始使用前，请确认：
- [ ] Dify API URL 配置正确：`http://10.133.0.147:18082`
- [ ] API Key 配置正确（运行 `./test-dify-api.sh` 验证）
- [ ] 应用 ID 正确（UUID 格式）
- [ ] 应用已发布
- [ ] 应用确实配置了工具（如果需要获取工具列表）
- [ ] 用户有访问该应用的权限

## 十、测试脚本使用说明

### 10.1 运行测试脚本

```bash
cd /Users/rabbit/works/code/github/Micro-Organism/Zero-AI/zero-ai-alibaba
./test-dify-api.sh
```

### 10.2 测试脚本功能

测试脚本会执行以下测试：
1. **测试1**：使用 API Key 测试 Console API 获取应用详情
2. **测试2**：使用 Basic Auth 测试 Console API（预期失败，因为 Console API 不支持 Basic Auth）
3. **测试3**：使用 API Key 获取应用列表
4. **测试4**：使用 API Key 测试 V1 API

### 10.3 测试结果解读

- **HTTP状态码 200**：测试成功，API Key 有效
- **HTTP状态码 401**：认证失败，API Key 无效或已过期
- **HTTP状态码 404**：接口不存在或应用不存在

### 10.4 修改测试脚本

如果需要测试不同的 API Key，可以编辑 `test-dify-api.sh` 文件，修改以下变量：
```bash
DIFY_API_KEY="你的新API密钥"
APP_ID="你的应用ID"
```

## 十一、运维人员添加新工作流指南

### 11.1 场景说明

假设您已经配置了一个 Dify 工作流（例如"智能对话"），并在 Java 平台和前端实现了智能对话功能。现在需要添加新的工作流，本指南将说明运维人员如何在不写代码的情况下完成配置。

### 11.2 当前系统能力分析

**✅ 已支持的功能（无需写代码）：**
1. ✅ 从 `application-dev.yml` 动态加载应用配置
2. ✅ 前端自动显示所有配置的应用供选择
3. ✅ 后端自动识别应用类型（completion/chat/workflow）并调用对应 API
4. ✅ 支持流式响应和实时文本显示
5. ✅ 支持应用配置管理（通过前端界面）

**⚠️ 当前限制（需要开发人员修改代码）：**
- `DifyToolsConfig.java` 目前硬编码了 `app1-app5` 字段
- 如果要添加第 6 个及以上的应用，需要开发人员先修改 `DifyToolsConfig.java` 添加新字段

**💡 改进建议：**
- 建议将 `DifyToolsConfig.java` 改为使用 `Map<String, AppConfig>` 动态读取配置
- 这样运维人员就可以在配置文件中添加任意数量的应用，无需修改代码

### 11.3 运维人员操作步骤（当前方式）

#### 步骤1：在 Dify 平台创建新工作流

1. **登录 Dify 平台**：访问 http://10.133.0.147:18082
2. **创建工作流**：
   - 点击左侧导航栏的"工作流"
   - 点击"创建工作流"或"新建"
   - 设计您的工作流（添加节点、配置参数等）
   - 保存工作流
3. **发布工作流**：
   - 点击"发布"按钮
   - 确保工作流状态为"已发布"

#### 步骤2：获取应用信息

1. **获取应用ID（appId）**：
   - 在浏览器地址栏查看，URL 格式为：`/app/{appId}/develop`
   - 例如：`http://10.133.0.147:18082/app/新应用ID/develop`
   - 复制这个 UUID 格式的应用ID

2. **获取 API Key**：
   - 点击左侧边栏的"发布"
   - 找到"API Access"或"API 密钥"部分
   - 点击"创建 API Key"或"生成新密钥"
   - **重要**：立即复制并保存 API Key（创建后只能查看一次）

#### 步骤3：确定应用类型和输入参数

根据工作流的设计，确定：
- **应用类型**：`completion`、`chat` 或 `workflow`
  - `completion`：文本生成类应用，使用 `inputs` 对象
  - `chat`：对话类应用，需要 `query` 参数（顶级参数）
  - `workflow`：工作流应用，使用 `/v1/workflows/run` 接口
- **输入参数模板**：查看 Dify 工作流的输入变量，确定需要哪些参数

**示例：**
- Completion 类型：`{"meeting_content": ""}`
- Chat 类型：`{"query": ""}` 或 `{"jobname": "", "query": ""}`
- Workflow 类型：`{"query": ""}` 或 `{}`

#### 步骤4：在配置文件中添加新应用

编辑 `application-dev.yml` 文件，在 `dify.api.tools` 下添加新应用配置：

```yaml
dify:
    api:
        url: http://10.133.0.147:18082
        tools:
            # 现有应用配置...
            app1:
               name: "文本生成应用测试"
               appid: "c46e6278-529e-4baf-9689-82e36f71ccfd"
               key: ${DIFY_API_KEY:app-Li1IQ3aoUALUG9QafnY5xl5c}
               description: "文本生成应用测试"
            # ... 其他现有应用 ...
            
            # 添加新应用（如果已有 app1-app5，添加 app6）
            app6:
               name: "新工作流名称"
               appid: "新应用ID-UUID格式"
               key: ${DIFY_API_KEY:新API密钥}
               description: "新工作流的描述信息"
```

**⚠️ 重要提示：**
- 如果这是第 6 个应用，需要先联系开发人员修改 `DifyToolsConfig.java` 添加 `app6` 字段
- 或者使用前端"应用配置管理"功能添加（推荐，无需修改代码）

#### 步骤5：使用前端界面添加（推荐方式）

**更简单的方式**：使用前端"应用配置管理"功能

1. **访问前端界面**：打开智能对话页面
2. **进入应用配置管理**：
   - 点击"应用配置管理"标签页
   - 点击"添加应用"按钮
3. **填写应用信息**：
   - **应用名称**：输入工作流名称（例如："新智能对话"）
   - **应用ID**：粘贴从 Dify 获取的 appId
   - **应用类型**：选择 `completion`、`chat` 或 `workflow`
   - **输入参数模板**：输入 JSON 格式的模板（例如：`{"query": ""}`）
   - **API Key**：粘贴从 Dify 获取的 API Key（可选，留空使用全局配置）
   - **描述**：输入工作流描述
   - **启用**：勾选启用
4. **保存配置**：点击"确定"保存

**优势**：
- ✅ 无需修改配置文件
- ✅ 无需重启服务（配置立即生效）
- ✅ 可以随时编辑或删除
- ✅ 支持启用/禁用

#### 步骤6：验证配置

1. **重启服务**（如果使用配置文件方式）：
   ```bash
   # 重启 Java 应用
   systemctl restart zero-ai-alibaba
   # 或使用其他重启方式
   ```

2. **验证配置加载**：
   - 查看启动日志，确认新应用已加载
   - 日志中应显示：`加载应用配置: 新工作流名称 (新应用ID) - 类型: workflow`

3. **前端测试**：
   - 打开智能对话页面
   - 在"选择应用"下拉框中应该能看到新添加的应用
   - 选择新应用，填写输入参数，测试调用

### 11.4 完整操作流程总结

**方式一：使用前端界面（推荐，无需写代码）**

```
1. 在 Dify 平台创建新工作流 → 获取 appId 和 API Key
2. 在前端"应用配置管理"中添加新应用配置
3. 在前端"Completion Messages"标签页选择新应用测试
✅ 完成！无需修改代码，无需重启服务
```

**方式二：使用配置文件（需要开发人员支持）**

```
1. 在 Dify 平台创建新工作流 → 获取 appId 和 API Key
2. 联系开发人员修改 DifyToolsConfig.java（如果是第6个及以上应用）
3. 在 application-dev.yml 中添加新应用配置
4. 重启 Java 服务
5. 在前端测试新应用
⚠️ 需要开发人员协助修改代码
```

### 11.5 常见问题

**Q1：添加新应用后，前端看不到？**
- 检查应用是否已启用（`enabled: true`）
- 检查应用配置是否正确加载（查看启动日志）
- 刷新前端页面

**Q2：如何确定应用类型？**
- 查看 Dify 工作流的 API 文档（在"发布" → "API Access"中）
- 如果 API 路径是 `/v1/workflows/run`，类型是 `workflow`
- 如果 API 路径是 `/v1/chat-messages`，类型是 `chat`
- 如果 API 路径是 `/v1/completion-messages`，类型是 `completion`

**Q3：输入参数模板如何填写？**
- 查看 Dify 工作流的输入变量
- 参考现有应用的配置格式
- 如果不确定，可以先填写 `{}`，然后在测试时根据错误信息调整

**Q4：API Key 在哪里配置？**
- 方式1：在应用配置中单独配置（推荐，每个应用使用自己的 API Key）
- 方式2：使用全局配置 `dify.api.key`（所有应用共享）

### 11.6 最佳实践

1. **使用前端界面管理**：优先使用前端"应用配置管理"功能，避免修改配置文件
2. **每个应用独立 API Key**：为每个应用配置独立的 API Key，便于权限管理
3. **描述信息要清晰**：在配置中添加清晰的描述，便于识别和管理
4. **测试后再启用**：新应用配置后，先测试确认无误再启用
5. **定期检查 API Key**：定期检查 API Key 是否有效，避免过期导致调用失败

## 十二、相关文档

- [发布功能总结](./发布/发布功能总结.md)
- [API 集成学习](./发布/Dify-API集成学习.md)
- [WebApp 设置](./发布/webapp/WebApp设置.md)
- [访问控制](./发布/webapp/访问控制.md)
- [MCP 服务器](./发布/MCP服务器.md)
