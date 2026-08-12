# 01 · 认识 LLaMA-Factory

## 本章目标

用自己的话说明：LLaMA-Factory 是什么、能做什么、不适合什么；以及一条完整微调链路长什么样。

## 核心概念

**LLaMA-Factory** 是面向大语言模型的训练与微调平台：尽量少写代码，通过 WebUI 或 YAML + CLI 完成微调、评估、推理与导出。

官方概括的能力大致包括：

| 维度 | 内容（摘要） |
|------|----------------|
| 模型 | LLaMA、Qwen、Mistral、Gemma、ChatGLM、Phi、多模态 LLaVA 等大量预训练模型 |
| 训练算法 | 增量预训练、指令 SFT、奖励模型、PPO、DPO、KTO、ORPO 等 |
| 精度 / 方法 | 全参、冻结、LoRA、QLoRA（多重量化后端）等 |
| 优化与加速 | GaLore、DoRA、FlashAttention-2、Unsloth 等 |
| 推理 | Transformers（Hugging Face）、vLLM |
| 监控 | LlamaBoard、TensorBoard、Wandb、MLflow、SwanLab 等 |

## 一条最小闭环（先记住这个）

```text
选基座模型 → 准备/注册数据 → SFT（常用 LoRA）
          → 保存 adapter / checkpoint
          →（可选）合并 LoRA → 推理试聊 → 评估
          →（可选）量化导出上线
```

入门阶段建议默认走：**LoRA + SFT**。显存紧时再考虑 QLoRA；全参微调放到后面。

## 适合 / 不适合（先建立边界）

| 更适合 | 不太适合当第一站 |
|--------|------------------|
| 本地/云端对开源模型做 SFT、LoRA、常见对齐 | 从零预训练千亿模型（成本与工程远超本框架入门范围） |
| 用配置/WebUI 快速试算法与数据 | 只要调用闭源 API、不做权重更新 |
| 教学、实验、中小规模定制 | 把「点几次 WebUI」当成完整 MLOps（仍需数据与评估纪律） |
| 多模型、多 stage 的统一入口 | 极端定制训练循环（可能最终仍要改源码/自写 Trainer） |

一句话：它降低的是 **微调工程门槛**，不替代 **数据质量、任务定义与评价**。

## WebUI 与 CLI 怎么选

| 方式 | 适合 | 特点 |
|------|------|------|
| WebUI | 第一次上手、调参试错 | `llamafactory-cli webui`，零代码 |
| CLI + YAML | 可复现实验、脚本化、服务器跑批 | `llamafactory-cli train xxx.yaml` |

建议：先用 WebUI 建立直觉，再用 YAML 固化实验。

## 几个容易混淆的词

| 术语 | 白话 |
|------|------|
| 基座模型 `model_name_or_path` | 预训练好的原模型（HF 名或本地路径） |
| Adapter / LoRA | 微调时学到的「补丁」权重，通常很小 |
| `template` | 对话模板，必须与模型族匹配（如 qwen、llama3） |
| `stage: sft` | 监督微调阶段；还有 pt、dpo、kto 等 |
| `output_dir` | 训练产物目录（checkpoint、日志、loss 图等） |
| Merge | 把 LoRA 合并进基座，得到完整权重，方便单独部署 |

## Step by step

1. 打开官方首页，扫一眼 Getting Started 与 Advanced 目录。  
   - 中文：https://llamafactory.readthedocs.io/zh-cn/latest/  
   - 英文：https://llamafactory.readthedocs.io/en/latest/
2. 在纸上或笔记里画出上面的「最小闭环」。
3. 明确当前阶段目标：  
   - **概念期**：能讲清闭环 + 会读一份 SFT YAML（见第 16 章）  
   - **将来实操**：用 demo 数据对较小 Instruct 模型做一次 LoRA SFT 并能 chat（见第 13 章）

## 检查点

- [ ] 能说出 LLaMA-Factory 相对「手写 Trainer 脚本」的价值（配置化 / WebUI / 多算法）
- [ ] 能解释 LoRA adapter 与合并后全量模型的区别
- [ ] 知道 `template` 必须和模型对应
- [ ] 能举出至少一条「它不太适合当第一站」的场景

## 常见坑

- 把「会点 WebUI」当成「懂微调」：还要会数据格式与 YAML 复现。
- 一开始就冲 DPO/PPO：先把 SFT 闭环跑通。
- 忽略 `template`：训完看起来「会说话」但格式错乱、效果差。

## 官方对照

- 欢迎页（能力列表）：https://llamafactory.readthedocs.io/zh-cn/latest/
- 外链汇总：[推荐阅读.md](../00-总览/推荐阅读.md)

## 下一章

若本机暂不实操，建议接着建立词汇与规划：  
→ [14-术语表.md](../03-概念与工具/14-术语表.md) 或 [13-无GPU与云端学习规划.md](../03-概念与工具/13-无GPU与云端学习规划.md)  

按序号继续：  
→ [02-环境安装.md](02-环境安装.md)（通读概念即可）
