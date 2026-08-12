# 常见问题 FAQ

> 官方权威 FAQ：https://github.com/hiyouga/LLaMA-Factory/issues/4614  
> 下面是学习路径中的高频问题速查；后续踩坑请追加到本页（只增补，不删历史条目）。

## 学习方式（无显卡 / 磁盘紧）

### Q0：本机没显卡、空间也不够，还能学吗？

能。按 **概念过关**：读入门主线 + 概念与工具（含自测），进阶专章按需；手写 JSON/YAML 片段。见 [文档中心](../README.md)。  
实操留给云端，见 [13-无GPU与云端学习规划.md](../03-概念与工具/13-无GPU与云端学习规划.md)。

### Q0b：一定要 clone LLaMA-Factory 到笔记本吗？

概念期 **不必**。用官方 readthedocs + GitHub 网页浏览 `examples/`、`data/` 即可，避免源码、依赖和模型缓存占盘。

### Q0c：CPU 能训练吗？

理论上能跑极小实验，但慢到几乎没有学习反馈。更推荐：概念学透 → 短租 GPU 按最小闭环验证。

### Q0d：训完效果差、或只是在规划阶段怕踩坑？

先看 [19-训练效果诊断.md](../03-概念与工具/19-训练效果诊断.md) 与 [20-模型与template选型.md](../03-概念与工具/20-模型与template选型.md)，再回对应主线章节。

### Q0e：文档怎么按文件夹找？

打开 [文档中心](../README.md)：`00-总览` / `01-入门主线` / `02-进阶专题` / `03-概念与工具`。

## 安装与环境

### Q1：`llamafactory-cli` 找不到？

- 确认已 `pip install -e .` 且当前 shell 激活了对应虚拟环境。
- `which llamafactory-cli` / `pip show llamafactory` 排查。

### Q2：`torch.cuda.is_available()` 为 False？

- 驱动：`nvidia-smi` 是否正常。
- 是否误装 CPU 版 PyTorch；按 CUDA 版本重装官方推荐 wheel。
- 容器场景检查是否挂载了 GPU。

### Q3：依赖冲突装不上？

- 官方建议可试：`pip install --no-deps -e .`，再手动对齐 `torch` 等核心包。
- 新建干净 venv 往往比在旧环境硬修更快。

## 数据

### Q4：WebUI / 训练找不到我的数据集？

- 是否写入 `data/dataset_info.json`（以仓库实际文件名为准）。
- key 名是否与 `dataset:` 完全一致。
- JSON 是否合法；`columns` 是否映射到真实字段名。

### Q5：Alpaca 和 ShareGPT 怎么选？

- 单轮/简单多轮指令：Alpaca 足够。
- 复杂角色、工具调用、OpenAI messages：ShareGPT。
- 预训练只用 text 列的 Alpaca 式格式，不用 ShareGPT。

## 训练

### Q6：CUDA Out of Memory？

尝试顺序（由易到难）：

1. 减小 `cutoff_len`
2. `per_device_train_batch_size=1`，加大 `gradient_accumulation_steps`
3. 换更小模型
4. 使用 QLoRA / 量化相关选项（见第 09、10 章）
5. DeepSpeed ZeRO 等（第 10 章）

### Q7：loss 不降或变成 NaN？

- 学习率是否过大；先回到示例默认值。
- 数据是否有空 `output`、异常超长样本。
- `template` 是否匹配。
- bf16/fp16 与硬件是否匹配。

### Q8：如何断点续训？

- CLI：`resume_from_checkpoint` 指向 `checkpoint-*`。
- WebUI：指定适配器路径。
- 若曾 `save_only_model: true`，通常不能完整 resume。

### Q9：多卡占满了怎么办？

```bash
CUDA_VISIBLE_DEVICES=0,1 llamafactory-cli train your.yaml
```

## 合并与推理

### Q10：合并 LoRA 失败或效果异常？

- 基座必须是 **未量化** 的对应模型。
- `adapter_name_or_path` 指向正确实验。
- `template` 与训练时一致。

### Q11：推理完全不像微调过？

- 是否加载了 adapter / 是否用了 merged 路径。
- `finetuning_type` 是否声明为 `lora`。
- 对话模板是否一致。

## 评估

### Q12：评估很慢或下载失败？

- 先用小配置验证通路。
- 检查网络与镜像；确认 `save_dir` 不冲突。
- 业务上可先用私有集 + chat 抽查。

## 学习路径

### Q13：文档示例里的模型名和我仓库不一样？

正常。以你 clone 的 `examples/` 与当前官方文档版本为准，把本笔记中的模型 id 当成「占位示例」。

### Q14：和 Unsloth / 其他框架什么关系？

LLaMA-Factory 可集成多种加速与算法后端；先把本框架主链路跑通，再在第 09 章按需开启 Unsloth 等选项。

---

## 我的踩坑追加区

| 日期 | 现象 | 原因 | 解决 |
|------|------|------|------|
| | | | |
