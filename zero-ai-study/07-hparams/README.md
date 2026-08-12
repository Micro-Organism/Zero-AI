# Step 7 — 训练参数深挖 Hyperparameters

**上一步：** [../06-data-craft](../06-data-craft/)  
**下一步：** [../08-retrain](../08-retrain/)  
**看板：** http://localhost:5173/hparams

## 本步目标

结合你的 **v1 实验** 与 **v2 数据（500+）**，搞懂旋钮并写出可执行、可归因的改参计划。

## 结合 v1 → v2 的推荐配置

| 项 | v1（大约） | v2 计划 | 为什么 |
|----|------------|---------|--------|
| 数据 | ~9 条 | 500+ + Holdout100 | 先补监督信号 |
| max_steps | 60 | **120** | 数据够了再适度加步 |
| r / alpha | 16 / 16 | **保持** | 便于归因，防同时猛改 |
| lr | ~2e-4 | 2e-4 | Unsloth QLoRA 常见起点 |
| batch × accum | （视 Notebook） | **2 × 4**（有效≈8） | T4 稳妥 |
| max_seq_length | 2048 | 2048 | 入门 QA 够用 |
| 4bit | True | **True** | 装下 8B 基座 |

## 技术要点（面试用）

- **r**：低秩容量；太大 + 数据不足 → 过拟合  
- **alpha**：常与 r 联动（alpha/r 缩放直觉）  
- **有效 batch** ≈ `per_device_batch × accum`（×GPU）  
- **4bit**：装基座；**LoRA**：改哪些参数——正交  

## 完成标准

看板 6 项勾选 + 三个「为什么」+ v2 计划 + 面试口述通过校验 → 同步 `hparams_notes.md`。
