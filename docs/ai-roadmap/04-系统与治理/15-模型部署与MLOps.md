# 模型部署与 MLOps 路线

> 一句话定位：把数据、模型和代码变成可版本化、可观测、可扩缩、可回滚的服务，并明确 Python AI 服务与 Java 业务系统的边界。

## 快速概览

| 层 | 主要职责 | 典型组件 | 验收证据 |
|---|---|---|---|
| Experiment | 配置、指标、artifact 追踪 | MLflow/W&B 类工具 | run lineage |
| Registry | 模型版本、阶段、审批 | model registry、object storage | model card/签名 |
| Serving | 在线/批量推理 | FastAPI、推理引擎、batch job | API/SLO |
| Delivery | 构建、测试、部署、回滚 | Docker、CI/CD、Kubernetes | immutable image |
| Operations | 监控、漂移、安全、成本 | logs/metrics/traces、alerts | dashboard/runbook |

## 学习地图（表格）

| Step | 主题 | 必做任务 |
|---:|---|---|
| 1 | 模型打包 | 固定权重、tokenizer、预处理、依赖 |
| 2 | FastAPI 服务 | schema、health、timeout、error mapping |
| 3 | 推理模式 | online、async、batch、streaming 对比 |
| 4 | Docker | 非 root、镜像分层、健康检查 |
| 5 | CI/CD | 测试、评测门禁、镜像扫描、发布 |
| 6 | Registry/Lineage | data-code-config-model 可追溯 |
| 7 | Observability | logs、metrics、traces、quality/cost |
| 8 | Rollout/Governance | canary、rollback、权限、审计、保留策略 |

## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | artifact/model registry、data-code-config lineage | 管理模型版本与来源 | Git、存储 | 线上版本可追到训练 run | `14`、`19` |
| 必会 | FastAPI/gRPC、schema、health、timeout、idempotency | 提供稳定推理契约 | Python/网络 | 有 readiness、错误码和契约测试 | `01` |
| 必会 | online/streaming/async/batch serving | 匹配延迟和吞吐目标 | 队列/并发 | 能按 workload 选择形态 | `16` |
| 必会 | Docker、dependency lock、non-root、image scan/SBOM | 构建可复现安全运行时 | Linux | 镜像不可变且可扫描回滚 | `20` |
| 进阶 | Kubernetes、GPU scheduling、autoscaling、queue | 调度多模型和弹性负载 | 容器/分布式 | 能定义资源、探针和扩缩容信号 | `16` |
| 必会 | logs/metrics/traces、OpenTelemetry 思想、SLO/alert | 观测请求、质量代理和成本 | 后端工程 | 能从 trace 定位模型/工具错误 | `12`、`14` |
| 必会 | CI/CD、evaluation gate、shadow/canary/blue-green、rollback | 安全发布模型与 Prompt/索引 | 测试/评测 | 能演练坏版本阻断和回滚 | `14` |
| 进阶 | feature/prompt/index version、drift/retraining pipeline | 管理模型外在线状态 | 数据工程 | 能独立回滚每种 artifact | `12`、`19` |
| 了解 | KServe/Triton/vLLM 类 serving platform | 标准化或高性能模型服务 | 性能/平台 | 能基于模型和并发选引擎 | `16` |

## 纵向：从原理到交付的完整闭环

```text
训练 run -> 离线评测门禁 -> model registry -> immutable image
        -> staging smoke/load/security -> shadow/canary -> production
        -> logs/metrics/traces + quality/cost -> alert -> rollback/retrain
```

| 交付环节 | 必须版本化 | 失败恢复 |
|---|---|---|
| 数据/训练 | dataset、code、config、seed、base model | 重现实验 |
| 模型包 | weight/adapter、tokenizer、template、preprocess | 回到上一 artifact |
| 服务 | API schema、image digest、runtime config | 蓝绿/金丝雀回滚 |
| 在线状态 | prompt/index/tool schema、feature flags | 独立回滚配置/索引 |
| 监控 | dashboard、alert、runbook | 降级、熔断、人工接管 |

## 横向：与其他技术的连接

- **与后端工程**：SLO、限流、熔断、鉴权、幂等、审计与回滚可复用既有 Java 经验。
- **与数据工程**：线上输入分布、反馈、标签回流和数据版本构成训练数据闭环。
- **与评测**：CI 中跑快速回归，发布前跑完整评测，线上监控质量代理和业务指标。
- **与性能**：batch、quantization、cache、模型并行和推理引擎决定 GPU 利用率。
- **与安全**：模型文件、容器、依赖、Prompt、工具权限和用户数据都是供应链/运行时边界。
- **与治理**：模型卡、审批、保留/删除策略和审计记录不能等上线后再补。

### Python 与 Java/Spring 职责边界

| 能力 | Python AI 服务 | Java/Spring 业务服务 |
|---|---|---|
| 数据实验/训练 | 主责：PyTorch、HF、数据处理 | 非主责 |
| GPU 推理 | 主责或专业 serving engine | 通过稳定协议调用 |
| 模型预后处理 | 靠近模型实现并版本化 | 只保留业务级转换 |
| 用户/订单/权限/事务 | 不复制业务真值 | 主责 |
| Agent 工具业务动作 | 提出结构化调用 | 执行鉴权、幂等、审计和事务 |
| API Gateway/流量治理 | 暴露内部推理接口 | 主责或平台统一负责 |

推荐边界是“Python 负责模型生命周期，Java 负责业务一致性”。使用 HTTP/gRPC、消息队列或批任务连接，先定义 schema、超时、错误码、幂等键和 trace id，避免通过共享数据库强耦合。

## 技术对比与选型

### 推理形态

| 形态 | 延迟 | 吞吐 | 适用 |
|---|---|---|---|
| 同步 Online | 低延迟优先 | 中 | 实时分类、交互请求 |
| Streaming | 快速首响应 | 中 | LLM token 输出 |
| Async Queue | 可排队 | 高 | 长任务、可重试生成 |
| Batch | 不强调单条延迟 | 最高 | 离线 embedding、评测、批预测 |

### 部署选择

| 方案 | 优势 | 适用 | 注意 |
|---|---|---|---|
| FastAPI + PyTorch/HF | 灵活、易调试 | 小模型、定制预后处理 | 自行处理 batching/并发 |
| 专业 LLM Engine | continuous batching、KV 管理 | LLM 高吞吐 serving | 模型/量化兼容性 |
| Managed API | 运维少、快速 | 验证和弹性业务 | 数据、供应商、成本锁定 |
| Kubernetes | 调度、发布和隔离成熟 | 多服务/多环境平台 | GPU 调度和复杂度成本 |

## Step by Step

1. 将模型、tokenizer、模板、预处理与配置打成不可变版本，写加载 smoke test。
2. 用 FastAPI 实现 `/health/live`、`/health/ready` 和版本化推理接口，加入类型校验。
3. 加入 timeout、限流、错误映射、结构化日志、trace id 与敏感字段脱敏。
4. 制作非 root Docker 镜像，锁定依赖，扫描漏洞并记录 image digest。
5. 做 correctness、load、OOM 和故障注入测试，定义 P95/吞吐/错误率 SLO。
6. 接入实验 tracking 和 registry，保证线上版本可追溯到训练 run。
7. CI/CD 加入单测、端到端回归、评测阈值和 staging smoke。
8. 用 shadow/canary 发布，配置降级和自动/人工回滚，写值班 runbook。

## 最小项目与验收标准

**项目：可回滚的 AI 推理服务与发布流水线**

| 验收项 | 过关标准 |
|---|---|
| 可复现 | 新环境从 model version 启动结果一致 |
| API | schema、健康检查、超时、限流和错误码完整 |
| 容器 | 非 root、依赖锁定、镜像扫描、digest 可追溯 |
| 门禁 | 质量回归和性能阈值能阻止坏版本发布 |
| 观测 | logs/metrics/traces 覆盖 P95、错误、GPU、成本 |
| 发布 | canary、降级、回滚演练和 runbook 完成 |
| 边界 | Java 业务动作保持鉴权、事务、幂等与审计 |

## 常见误区与面试达标

- 误区：模型能在 notebook 推理就认为可以上线。
- 误区：只监控 CPU/GPU，不监控输入漂移、质量代理和单位成本。
- 误区：Python 与 Java 同时维护业务状态，形成双写和权限漏洞。
- 面试达标：能解释 online/batch/streaming、registry、canary、SLO 和 rollback。
- 面试达标：能画出训练到上线 lineage，并明确 Python/Java 服务契约。

## 下一步

进入 [16-分布式训练与性能优化](./16-分布式训练与性能优化.md)，学会测量并解决显存、训练与推理瓶颈。
