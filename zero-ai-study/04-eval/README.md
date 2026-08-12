# Step 4 — 评估 Eval

**上一步：** [../03-finetune](../03-finetune/)  
**下一步：** [../05-export-infer](../05-export-infer/)

## 本步目标

用 **同一组问题** 对比「基座 / 微调前」与「加载 LoRA 后」，写下主观结论。

入门阶段以人工抽检为主，不必上复杂自动评测。

## 操作

1. 复制日志模板：

```bash
cp 04-eval/eval_log.template.md 04-eval/eval_log.md
```

2. 准备 5～10 条测试题（可与训练集 **刻意不同**，避免只背答案）  
3. 在 Notebook 或本机推理里分别记录回答  
4. 判断：更贴风格？胡言乱语？过拟合？  

## 完成标准

- [ ] `eval_log.md` 至少一轮完整对比  
- [ ] 写明「是否值得继续加数据/加 steps」  
