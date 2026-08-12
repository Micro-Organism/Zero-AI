# Step 1 — 概念 Concepts

**上一步：** [../00-setup](../00-setup/)  
**下一步：** [../02-data](../02-data/)

## 本步目标

用自己的话区分这些概念（不要求背定义）：

| 概念 | 一句话 |
|------|--------|
| 预训练 | 大公司用海量数据先训出「通才」基座模型 |
| 微调 SFT | 用你的问答/对话数据，让模型更贴你的任务与口吻 |
| 迁移学习 | 把已学能力迁到相关新任务（微调是常见手段） |
| LoRA | 不改动全部权重，只训练很小的适配器矩阵 |
| QLoRA | 基座 4bit 量化 + LoRA，显存更省，免费 GPU 首选 |

## 建议阅读

统一维护：[`../docs/推荐阅读.md`](../docs/推荐阅读.md)（以后新文章都往那里加）。

入门优先：

1. [Unsloth LLM 微调指南](https://unsloth.ai/docs/zh/kai-shi-shi-yong/fine-tuning-llms-guide.md)  
2. [Hello LLM Fine-Tuning](https://lailoo.github.io/Hello-LLM-FineTuning/#/)（精读第 0/3 章 + 第 4 章 LoRA）  
3. [预训练 / 微调 / 迁移学习（CSDN）](https://blog.csdn.net/weixin_45277161/article/details/131544912)  
4. （可选）[Unsloth Studio](https://unsloth.ai/docs/zh/xin-zeng/studio.md)  

## 作业

复制 `notes.template.md` 为 `notes.md`，填完五个空再进入下一步：

```bash
cp 01-concepts/notes.template.md 01-concepts/notes.md
```

## 完成标准

- [ ] `notes.md` 五个填空都写了  
- [ ] 能向别人讲清：为什么入门用 QLoRA 而不是全量微调  
