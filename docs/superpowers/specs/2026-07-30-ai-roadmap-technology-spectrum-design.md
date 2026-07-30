# AI Roadmap Technology Spectrum Design

## 1. 目标

系统补齐 `docs/ai-roadmap` 的技术知识点，使路线不仅说明“如何学习和交付”，也能回答：

1. 每个主题有哪些必须掌握的经典与主流技术；
2. 每项技术解决什么问题，需要哪些前置知识；
3. 学到什么程度才算掌握，而不是只见过名称；
4. 交叉技术主要归属哪个章节，还与哪些章节关联；
5. 如何通过实验、对比或项目证明掌握程度。

## 2. 内容架构

### 2.1 每个编号主题增加统一章节

所有 `00-24` 编号文档增加：

```markdown
## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | ... | ... | ... | 能解释并完成最小实验 | ... |
| 进阶 | ... | ... | ... | 能与替代方案做受控对比 | ... |
| 了解 | ... | ... | ... | 能判断适用边界与成本 | ... |
```

章节放在“学习地图”之后、“纵向闭环”之前，使读者先看到学习顺序，再看到知识清单，随后进入完整工作流。

### 2.2 新增中央技术索引

创建 `docs/ai-roadmap/技术索引.md`，按技术族和关键词提供：

| 字段 | 含义 |
|---|---|
| 技术/别名 | 中文名、英文名、常用缩写 |
| 主归属 | 负责详细解释的唯一章节 |
| 关联章节 | 该技术作为前置、组件或应用出现的位置 |
| 层级 | 必会、进阶或了解 |
| 一句话定位 | 它解决的核心问题 |

例如 `ConvLSTM` 的主归属为时序预测，关联深度学习、CV 和 PyTorch；详细内容只在时序章节维护，其他章节通过链接引用。

## 3. 覆盖范围

### 3.1 基础与模型结构

- Python 科学计算、SQL、数据结构、并发、测试、环境与性能分析；
- 线性代数、微积分、概率统计、信息论与优化；
- 监督/无监督/半监督/自监督学习，线性模型、树模型、聚类、降维、异常检测与集成学习；
- MLP、CNN、RNN、LSTM、GRU、TCN、Attention、Transformer、Autoencoder、VAE、GAN、Diffusion、GNN；
- PyTorch tensor、autograd、module、data pipeline、训练循环、GPU、checkpoint、profiler 与 distributed primitives。

### 3.2 NLP、CV、LLM 与多模态

- NLP：n-gram、TF-IDF、Word2Vec、CRF、RNN/LSTM、Seq2Seq、Attention、BERT、GPT、Embedding、Reranker；
- CV：CNN 架构演进、检测、分割、ViT、CLIP、自监督视觉、OCR、生成视觉与 NeRF/3D 识别；
- LLM：tokenizer、Transformer、位置编码、长上下文、MoE、解码、KV Cache、tool use 与推理方法；
- 多模态：双编码器、cross-attention、projector、Q-Former、VLM、多模态 SFT、diffusion/flow、VLA。

### 3.3 时空、业务与音频专项

- 时序：统计模型、lag/rolling、RNN/TCN、ConvLSTM、PredRNN、时空 GNN、时序 Transformer、概率预测；
- 推荐：协同过滤、矩阵分解、FM/DeepFM、双塔、DIN/DIEN、序列推荐、ANN、bandit；
- 语音：DSP、mel/MFCC、CTC、Transducer、seq2seq ASR、speaker model、TTS、vocoder、audio-text model；
- 机器人/具身：状态估计、SLAM、规划、控制、RL、模仿学习、world model、VLA 与 sim-to-real。

### 3.4 训练与系统工程

- 预训练目标、数据治理、tokenizer、scaling、分布式与 checkpoint；
- SFT、PEFT、LoRA 系列、量化训练、偏好优化与 RLHF；
- RAG 检索/重排/GraphRAG，Agent workflow、memory、tool protocol 与安全控制；
- 评测、实验管理、部署、MLOps、量化、推理引擎、并行策略、AI 安全与治理。

## 4. 完整性标准

每个主题的技术谱系必须满足：

1. **基础原理**：覆盖该领域不可跳过的概念和经典方法；
2. **主流实践**：覆盖当前工程中常用的方法，而不是只讲历史；
3. **代表性前沿**：选取能解释发展方向的进阶技术，不追求穷举所有论文名；
4. **技术关系**：至少有一组替代、演进或组合关系；
5. **掌握证据**：必会技术必须能落到代码、实验、指标或错误分析；
6. **交叉归属**：跨领域技术明确唯一主章节和相关章节；
7. **可维护性**：模型家族优先于短期框架版本，易变能力以官方文档为准。

“完整”不等于收录所有 AI 名词。判断标准是：读者能建立稳定知识骨架，遇到新技术时能够定位其所属问题、前置、替代方案和验证方法。

## 5. 审计与验证

### 5.1 结构检查

- `00-24` 每篇恰好包含一个“核心技术要点与扩展谱系”；
- 每个谱系表至少包含“必会”和“进阶”层级；
- 中央索引覆盖谱系表中的规范化核心技术词；
- 所有本地链接递归有效，Markdown 表格列数一致。

### 5.2 内容抽查

- `04` 必须覆盖 CNN、RNN、LSTM、GRU、Attention、Transformer；
- `07` 必须覆盖 CNN、检测、分割、ViT 和视觉自监督；
- `23` 必须覆盖 ConvLSTM，并比较 CNN+LSTM、3D CNN、TCN、PredRNN、时空 Transformer；
- `08/09/10/12/16/17/22/24` 分别抽查 LLM、预训练、后训练、RAG/Agent、性能、具身、推荐和语音关键技术族；
- 扫描重复定义，跨章节只保留一个主归属。

## 6. 分批实施

1. 第一批：基础、数学、ML/DL、PyTorch、数据工程和中央索引骨架；
2. 第二批：NLP、CV、LLM、多模态、推荐、时序、语音、具身；
3. 第三批：预训练、微调、迁移、RAG/Agent、评测、MLOps、性能、安全、论文与求职；
4. 最终批：全局技术索引补齐、交叉链接审计、重复与遗漏复查。
