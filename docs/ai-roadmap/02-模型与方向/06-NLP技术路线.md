# NLP 技术路线

> 一句话定位：从文本清洗、表示和任务评测走到 Transformer，理解 LLM 建立在哪些 NLP 问题与方法之上。

## 快速概览

| 时代 | 文本表示 | 代表方法 | 仍需掌握的价值 |
|---|---|---|---|
| 统计 NLP | 词袋/TF-IDF | Naive Bayes、Logistic | 强基线、可解释、低成本 |
| 分布式表示 | 静态 Embedding | Word2Vec、GloVe | 相似度、词义空间直观 |
| 序列模型 | 上下文隐状态 | RNN/LSTM/GRU | 序列归纳偏置与局限 |
| 预训练模型 | 上下文 Embedding | BERT/Encoder | 理解型任务和迁移学习 |
| 生成式模型 | token 条件分布 | GPT/Llama/Qwen | 生成、微调、RAG、Agent |

## 学习地图（表格）

| Step | 主题 | 必做任务 |
|---:|---|---|
| 1 | Unicode、正则、句子/词边界 | 中英文混合清洗与错误分析 |
| 2 | tokenization、vocabulary、OOV | 比较字、词、BPE/WordPiece |
| 3 | TF-IDF/线性基线 | 文本分类基线 |
| 4 | Embedding/相似度 | 语义检索与反例 |
| 5 | RNN/LSTM 与 Attention | 理解串行与长距离局限 |
| 6 | Transformer encoder/decoder | 分类与生成各一个实验 |
| 7 | 评测 | task metric + slice + 定性错误归类 |

## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | Unicode、regex、normalization、sentence/word boundary | 可靠处理多语言文本 | Python 字符串 | 能解释清洗对标签和语义的影响 | `01`、`19` |
| 必会 | n-gram、BoW、TF-IDF、BM25 | 词法统计表示与强基线 | 概率、稀疏向量 | 能实现分类/检索并解释权重 | `03`、`12` |
| 必会 | Word2Vec/GloVe、Embedding | 学习稠密语义空间 | 线代、负采样 | 能做相似度并分析静态词义局限 | `03` |
| 必会 | RNN、LSTM、GRU、BiRNN、BPTT | 建模上下文序列 | [04 深度学习](../01-基础与数据/04-神经网络与深度学习路线.md) | 能比较门控与长依赖 | `23-24` |
| 必会 | Seq2Seq、Attention、Encoder-Decoder | 将输入序列映射为输出序列 | RNN、softmax | 能解释 teacher forcing 与 exposure bias | `08` |
| 必会 | Transformer、BERT、GPT、T5 | 预训练表示与生成 | Attention、tokenizer | 能按任务选择 encoder/decoder | `08-11` |
| 进阶 | HMM、CRF、Viterbi | 结构化序列标注与全局解码 | 概率图 | 能解释局部分类与 CRF 差异 | `03` |
| 进阶 | LSA/LDA、topic model | 从文档集合发现低维主题结构 | 概率、矩阵分解 | 能比较词法主题与神经 Embedding | `02-03` |
| 进阶 | sentence embedding、bi-encoder、cross-encoder/reranker | 语义检索与精排 | 对比学习 | 能评 Recall/MRR 并构造 hard negative | `12` |
| 了解 | multilingual、domain adaptation、long-document NLP | 跨语言/领域/长文本 | Transformer | 能识别 tokenizer 与分布偏差 | `11`、`14` |

## 纵向：从原理到交付的完整闭环

```text
任务定义 -> 文本合规/清洗 -> tokenizer -> 统计基线
        -> 预训练表示/模型 -> fine-tune/probe -> task metric
        -> 长度/语言/领域 slice -> 服务化 -> 输入漂移监测
```

| 任务 | 典型输出 | 评测 | 额外风险 |
|---|---|---|---|
| 文本分类 | label/probability | Macro-F1、PR-AUC | 类别不平衡、领域漂移 |
| NER | token/span label | span-F1 | 分词与实体边界 |
| 语义检索 | ranked documents | Recall@K、MRR | hard negatives、假相似 |
| 摘要/生成 | token sequence | ROUGE + human rubric | 事实性、遗漏、幻觉 |

## 横向：与其他技术的连接

- **与机器学习**：TF-IDF + 线性模型是必保留基线，便于判断深度模型的真实增益。
- **与迁移学习**：BERT encoder 加任务头是标准的预训练 -> 下游迁移。
- **与 LLM**：decoder-only Transformer 把很多 NLP 任务统一为条件文本生成。
- **与 RAG**：Embedding、检索、重排是 NLP 排序问题；最终生成是另一阶段。
- **与多语言**：tokenizer 覆盖、语料比例和评测 slice 直接决定低资源语言表现。

## 技术对比与选型

| 方法 | 上下文化 | 优势 | 适合 |
|---|---|---|---|
| TF-IDF | 否 | 快、可解释、小数据强 | 分类/检索基线 |
| Word2Vec/GloVe | 否 | 轻量语义表示 | 词级相似/特征 |
| BERT/Encoder | 是、双向 | 理解/分类/表示强 | NLU、Embedding、Reranker |
| GPT/Decoder | 是、因果 | 生成和任务统一 | LLM、对话、Agent |
| Encoder-Decoder | 是 | 输入输出映射清晰 | 翻译、摘要、结构化转换 |

## Step by Step

1. 对一份中文数据做字符、长度、语言、重复和标签分布分析。
2. 训练 TF-IDF + Logistic 基线，记录重要词和失败样本。
3. 比较两种 tokenizer 的 vocabulary、平均 token 数和 OOV/拆分现象。
4. 用预训练 encoder 做文本分类，固定数据与基线比较。
5. 用句向量做语义检索，构建 hard negative 回归集。
6. 用 decoder 做一个结构化生成任务，记录格式错误和事实错误。

## 最小项目与验收标准

**项目：中文意图分类 + 语义检索对比**

| 验收项 | 过关标准 |
|---|---|
| 基线 | TF-IDF 与预训练模型使用同一 split |
| 指标 | 分类有 Macro-F1，检索有 Recall@K/MRR |
| 切片 | 按长度、类别、否定和领域词分析 |
| 报告 | 说明模型提升来自哪类样本，尚存哪类错误 |

## 常见误区与面试达标

- 误区：把 token、词和字当成同一概念，忽略 tokenizer 对成本与语义的影响。
- 误区：评估检索只看“感觉相关”，没有标注 query-document 基准。
- 面试达标：能区分 self-attention、masked self-attention 和 cross-attention。

## 下一步

主线进入 [08-大模型与生成式 AI 路线](./08-大模型与生成式AI路线.md)；如果要学视觉，从 [07-CV 路线](./07-CV技术路线.md) 独立开分支。
