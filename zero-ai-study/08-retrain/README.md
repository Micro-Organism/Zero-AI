# Step 8 — 再训与复评 Retrain

**上一步：** [../07-hparams](../07-hparams/)  
**看板：** http://localhost:5173/retrain  
**之后：** 见 [学习路径 · 进阶路线图](../docs/learning-path.md)

## 本步目标

用 **500+ v2 数据** + **Step 7 超参** 训练 `llama_lora_zh_v2`，并用弱题/Holdout 证明相对 v1 是否变好。

## Kaggle 最短路径

1. 上传 `datasets/sample_alpaca_zh_v2.jsonl` → Add Input  
2. `os.walk` 找真实路径 → `load_dataset("json", ...)`  
3. 改参：r=16, alpha=16, lr=2e-4, steps=120, batch=2, accum=4, 4bit, seq=2048  
4. `save_pretrained("llama_lora_zh_v2")`（勿覆盖 v1）  
5. 下载到 `outputs/llama_lora_zh_v2/`  
6. 弱题 + Holdout 复评，填写看板（替换所有「实填」）  

## 校验注意

看板最终校验要求 **真实 loss**，且弱题/对比中不能残留 `实填：……` / `实填结论：……`。

## 完成标准

6 项勾选 + loss + 真实复评/对比 + 面试口述 → 同步 `retrain_log.md`。
