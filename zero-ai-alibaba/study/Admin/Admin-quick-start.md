# 快速开始

> 待学习：https://java2ai.com/ecosystem/admin/quick-start

## 页面概述

Spring AI Alibaba Admin 是一个基于 Spring AI Alibaba 的 AI Agent 开发和评估平台，旨在为开发者和企业提供完整的 AI Agent 生命周期管理解决方案。

## 主要内容

### Project Background（项目背景）

Spring AI Alibaba Admin 支持从 Prompt 工程、数据集管理、评估器配置到实验执行和结果分析的完整工作流，帮助用户快速构建、测试和优化 AI Agent 应用。

### Core Features（核心功能）

#### 🤖 Prompt Management（Prompt 管理）
- Prompt Template Management：创建、更新和删除 Prompt 模板
- Version Control：支持 Prompt 版本管理和历史追踪
- Real-time Debugging：提供在线 Prompt 调试和流式响应
- Session Management：支持多轮对话会话管理

#### 📊 Dataset Management（数据集管理）
- Dataset Creation：支持多种格式的数据集导入和创建
- Version Management：数据集版本控制和历史管理
- Data Item Management：细粒度的数据项 CRUD 操作
- Create from Trace：支持从 OpenTelemetry trace 数据创建数据集

#### ⚖️ Evaluator Management（评估器管理）
- Evaluator Configuration：支持创建和配置各种评估器
- Template System：提供评估器模板和自定义评估逻辑
- Debugging Features：支持在线评估器调试和测试
- Version Management：评估器版本控制和发布管理

#### 🧪 Experiment Management（实验管理）
- Experiment Execution：自动化执行评估实验
- Result Analysis：详细的实验结果分析和统计
- Experiment Control：支持启动、停止、重启和删除实验
- Batch Processing：支持批量实验执行和结果对比

#### 📈 Observability（可观测性）
- Trace Tracking：集成 OpenTelemetry 提供完整的 trace 追踪
- Service Monitoring：支持服务列表和概览统计
- Trace Analysis：提供详细的 Trace 详情和 Span 分析

#### 🔧 Model Configuration（模型配置）
- Multi-model Support：支持主流 AI 模型，包括 OpenAI、DashScope、DeepSeek
- Configuration Management：统一的模型参数配置和管理
- Dynamic Switching：支持运行时动态更新模型配置

### System Architecture（系统架构）

#### Overall Architecture（整体架构）

Spring AI Alibaba Admin 的系统架构图展示了平台的各个组件和它们之间的关系。

### Quick Start（快速开始）

#### Prerequisites（前置要求）
- 🐳 Docker (for containerized deployment) + Docker Compose: 2.0+
- ☕ Java 17+ (for source code execution) + Maven: 3.8+
- 🌐 AI Model Provider API Keys，支持 OpenAI、DashScope、DeepSeek

#### Running from Source Code（从源码运行）

1. **Clone the Project**
   ```bash
   git clone https://github.com/spring-ai-alibaba/spring-ai-alibaba-admin.git
   cd admin
   ```

2. **Configure Your API Keys**
   - 根据你的模型提供商，修改 `spring-ai-alibaba-admin-server/model-config.yaml` 中的模型配置
   - 如果使用 DashScope，请参考 `model-config-dashscope.yaml` 模板
   - 如果使用 DeepSeek，请参考 `model-config-deepseek.yaml` 模板
   - 如果使用 OpenAI，请参考 `model-config-openai.yaml` 模板

3. **Nacos Configuration (Optional)**
   - 如果需要修改 Nacos 地址，请更新 `spring-ai-alibaba-admin-server/src/main/resources/application.yml` 文件中的配置

4. **Start SAA Admin**
   - 在根目录执行启动脚本：`sh start.sh`
   - 在 `spring-ai-alibaba-admin-server` 目录启动应用：`mvn spring-boot:run`

5. **Access the Application**
   - 打开浏览器访问 `http://localhost:8080` 使用 SAA Admin 平台

6. **Connect Your AI Agent Application**
   - 在你的 Spring AI Alibaba Agent 应用中添加相关依赖
   - 配置 Nacos 地址和 promptKey
   - 设置可观测性参数

## License（许可证）

本项目基于 Apache License 2.0 开源许可证。

## Contributing（贡献）

欢迎提交 Issues 和 Pull Requests 来帮助改进项目。

