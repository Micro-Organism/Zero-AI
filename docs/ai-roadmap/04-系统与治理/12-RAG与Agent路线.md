# RAG 与 Agent 技术路线

> 一句话定位：RAG 解决“模型如何获得可更新且可引用的外部知识”，Agent 解决“模型如何在受控循环中使用工具完成多步任务”。

## 快速概览

| 系统 | 核心能力 | 主要组件 | 首要风险 |
|---|---|---|---|
| RAG | 检索证据后生成 | ingestion、chunk、embedding、retrieve、rerank、generate | 找错、漏找、引用不实 |
| Workflow | 固定步骤编排 | 状态机、规则、工具、重试 | 分支遗漏、状态不一致 |
| Agent | 动态规划与工具使用 | model、tools、memory/state、control loop、guardrail | 越权、循环、不可预测 |

## 学习地图（表格）

| Step | 主题 | 必做实验 |
|---:|---|---|
| 1 | 文档解析、切分、元数据 | 对标题/表格/代码保留结构 |
| 2 | Embedding 与索引 | 比较 dense、BM25、hybrid |
| 3 | 召回与重排 | 建标注 query 集，测 Recall@K/MRR/nDCG |
| 4 | 上下文构造与生成 | 测上下文相关性、引用和拒答 |
| 5 | 工具调用 | JSON Schema、参数校验、幂等和超时 |
| 6 | Workflow/Agent | 状态、路由、最大步数、失败恢复 |
| 7 | 评测与观测 | trace 每一步，区分检索错与生成错 |
| 8 | 安全与交付 | 权限、注入防护、成本、缓存、降级 |

## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | parser、structure-aware chunk、metadata、incremental index | 将知识源变成可检索单元 | NLP、数据工程 | 能评解析覆盖和增量一致性 | `06`、`19` |
| 必会 | BM25、dense embedding、hybrid fusion | 词法/语义候选召回 | IR、Embedding | 能在标注集报告 Recall@K | `06` |
| 必会 | bi-encoder、cross-encoder reranker、hard negative | 提升候选排序精度 | 对比/排序 | 能报告 MRR/nDCG 与延迟 | `14` |
| 必会 | context construction、citation、grounded generation | 基于证据生成并拒答 | LLM、Prompt | 能区分检索错与生成错 | `08`、`14` |
| 进阶 | query rewrite/decomposition、multi-query、HyDE | 改善复杂或表达不匹配查询 | LLM、检索 | 能用同一 query 集做消融 | `08` |
| 进阶 | GraphRAG/knowledge graph、entity/relation retrieval | 处理关系和跨文档聚合 | 图、实体抽取 | 能说明构图成本和适用问题 | `06`、`19` |
| 必会 | tool/function calling、JSON Schema、state machine/workflow | 安全执行结构化动作 | API、后端 | 工具有校验、幂等、超时和审计 | `15`、`20` |
| 进阶 | ReAct/planner-executor、memory/state、human-in-loop | 动态多步任务与恢复 | Agent 基础 | 能限制步数/预算并 trace 决策 | `14`、`20` |
| 了解 | MCP/工具协议、多 Agent | 标准化连接或角色协作 | 分布式系统 | 能判断何时复杂度不值得 | `15` |

## 纵向：从原理到交付的完整闭环

```text
知识源登记 -> 解析/清洗 -> 结构化切分 -> embedding/BM25 -> 索引
          -> query 改写 -> 召回 -> rerank -> 上下文组装 -> 生成/引用
          -> 离线评测 -> trace/误差归因 -> API -> 监控/更新/回滚

任务定义 -> 工具契约 -> 状态机/控制循环 -> 权限与预算 -> 执行
        -> 结果校验 -> 重试/补偿 -> 人工审批 -> trace -> 回归评测
```

| 层 | 输入错误表现 | 应测指标 | 优先修复 |
|---|---|---|---|
| 解析/切分 | 表格丢列、标题断裂 | parse success、chunk coverage | parser、结构感知切分 |
| 检索 | 正确文档不在 Top-K | Recall@K、MRR、nDCG | query、embedding、hybrid |
| 重排 | 正确候选排序靠后 | rerank nDCG、latency | hard negative、reranker |
| 生成 | 有证据仍答错或乱引 | faithfulness、answer correctness | prompt、context、模型 |
| Agent 执行 | 工具选错、参数错、循环 | task success、tool error、steps | schema、路由、预算/状态 |

## 横向：与其他技术的连接

- **与微调**：RAG 更新知识，微调稳定行为；先建立 RAG/Prompt 基线，再证明微调的必要性。
- **与 NLP**：chunk、Embedding、BM25、reranker 分别涉及文本结构、表示与排序。
- **与数据库**：向量索引不替代关系数据库；权限、事务和事实源仍由业务系统负责。
- **与后端工程**：工具必须有 schema、鉴权、幂等、超时、重试、审计和补偿。
- **与安全**：检索内容和工具返回值都是不可信输入，要防 prompt injection、数据越权和敏感信息泄露。
- **与评测**：端到端分数必须拆成检索、生成、工具和系统指标，否则无法定位改进点。

## 技术对比与选型

### RAG 与微调

| 需求 | RAG | 微调 | 推荐 |
|---|---|---|---|
| 高频更新事实 | 强 | 弱 | RAG |
| 固定输出格式/行为 | 中 | 强 | 先 Prompt，必要时微调 |
| 来源引用与审计 | 强 | 弱 | RAG |
| 领域术语和语言习惯 | 中 | 强 | 微调，可叠加 RAG |
| 私域知识 + 稳定行为 | 强 | 强 | RAG + 微调，分别评测 |

### Workflow 与 Agent

| 方案 | 路径决定者 | 可预测性 | 适用 |
|---|---|---|---|
| 普通函数/规则 | 代码 | 最高 | 步骤固定、规则明确 |
| Workflow/状态机 | 代码 + 条件路由 | 高 | 有限分支、需审计流程 |
| Agent | 模型动态选择 | 较低 | 开放任务、工具组合不固定 |
| Multi-Agent | 多模型角色协作 | 最低、成本高 | 只有单 Agent 无法合理分工时 |

### 检索方案

| 方法 | 强项 | 弱项 | 适合 |
|---|---|---|---|
| BM25 | 精确词、编号、专有名词 | 同义语义弱 | 法条、错误码、关键词 |
| Dense Retrieval | 语义改写、自然语言 | 精确词可能漏召回 | 问答、语义匹配 |
| Hybrid | 兼顾词法和语义 | 调参和融合更复杂 | 生产默认候选 |
| Reranker | 提高候选精排 | 增加延迟和成本 | Top-K 候选重排 |

## Step by Step

1. 选择来源可控的 30-100 篇文档，建立解析、元数据和增量更新流程。
2. 手工标注至少 50 个 query 及相关证据，固定 retrieval test set。
3. 比较 BM25、dense、hybrid；先优化 Recall@K，再加入 reranker。
4. 构造上下文并要求逐条引用，加入“证据不足则拒答”。
5. 建立端到端评测，将失败归为解析、检索、重排、生成或数据问题。
6. 增加一个只读工具，做 schema 校验、鉴权、超时和结果验证。
7. 用显式状态机实现 2-4 步 workflow，再判断是否需要动态 Agent。
8. 加入最大步数、token/费用预算、人工审批、trace、缓存与降级。

## 最小项目与验收标准

**项目：带引用和受控工具调用的知识助手**

| 验收项 | 过关标准 |
|---|---|
| 数据 | 来源、版本、权限和更新策略明确 |
| 检索 | 有标注集，报告 BM25/dense/hybrid 的 Recall@K |
| 生成 | 引用可定位原文，证据不足能够拒答 |
| Agent | 工具参数校验，有限权、最大步数和失败恢复 |
| 评测 | 检索、生成、工具、端到端指标分别报告 |
| 工程 | trace、P95、成本、缓存、超时、降级和回滚完整 |

## 常见误区与面试达标

- 误区：没有 retrieval ground truth，只凭几条问答判断 RAG。
- 误区：简单确定流程也做 Agent，增加不可预测性与成本。
- 误区：把检索文本直接视为可信指令，造成注入和越权。
- 面试达标：能解释 chunk、hybrid、rerank、faithfulness 及错误归因。
- 面试达标：能画出 Agent control loop，并说明权限、状态、预算和补偿。

## 下一步

进入 [14-模型评测与算法工程化](./14-模型评测与算法工程化.md) 建立系统化评测，再用 [15-模型部署与 MLOps](./15-模型部署与MLOps.md) 完成交付。
