# 21 · DeepSpeed 配置精读

## 本章目标

在不碰多卡机器的前提下，读懂 LLaMA-Factory 里 DeepSpeed / ZeRO 在干什么、配置文件关键字段含义、以及该选 ZeRO-2 还是 ZeRO-3。

> 权威细节以官方为准：  
> https://llamafactory.readthedocs.io/zh-cn/latest/advanced/distributed.html  
> 示例目录通常在上游仓库 `examples/deepspeed/`。

## 它解决什么问题

单卡显存不够装下「模型 + 梯度 + 优化器状态」时，DeepSpeed 的 **ZeRO** 把这些状态切到多张卡上，用通信换显存。

和「只开 DDP（每卡一份完整模型）」相比：ZeRO 更省显存，但通常更慢、更绕。

## ZeRO 阶段直觉

| 阶段 | 大致切什么 | 显存 | 速度（相对） |
|------|------------|------|--------------|
| ZeRO-0 | 相当于不开 ZeRO 优化 | 最高 | 通常更快 |
| ZeRO-1 | 主要切优化器状态 | 降一档 | 较好 |
| ZeRO-2 | 再切梯度 | 更省 | 中等 |
| ZeRO-3 | 再切模型参数 | 最省 | 往往最慢、通信重 |
| + offload | 把优化器/参数卸到 CPU | 显存再降 | 常常明显变慢 |

官方经验口径（摘要）：显存够时优先较低 stage，并避免不必要的 `offload`；stage 越高越省显存、也越容易变慢。

## 在 LLaMA-Factory 里怎么挂上

训练 YAML 里指定配置文件路径，例如：

```yaml
deepspeed: examples/deepspeed/ds_z3_config.json
```

启动仍常用：

```bash
llamafactory-cli train your_sft.yaml
```

也可用 `deepspeed` / `accelerate` 等启动器（多机、指定卡时细节见官方）。注意：用 `deepspeed` 命令启动时，**不要指望**像平时一样只用 `CUDA_VISIBLE_DEVICES` 选卡，官方要求改用 `--include localhost:...` 一类写法。

仓库里常见示例名（以你 clone 的版本为准）：

- `ds_z0_config.json` / ZeRO-0
- `ds_z2_config.json` / ZeRO-2
- `ds_z2_offload_config.json`
- `ds_z3_config.json` / ZeRO-3
- `ds_z3_offload_config.json`
- AutoTP 相关（DeepSpeed 较新版本，支持模型列表有限）

## 配置文件里常看的块

不必背全文，精读时盯这些：

| 块 / 字段 | 人话 |
|-----------|------|
| `zero_optimization.stage` | ZeRO 阶段 0/1/2/3 |
| `offload_optimizer` / `offload_param` | 是否卸到 CPU（省显存、慢） |
| `bf16` / `fp16` | 混合精度开关，需与硬件/YAML 一致 |
| `train_batch_size` / `train_micro_batch_size_per_gpu` / `gradient_accumulation_steps` | 与训练 YAML 的 batch 体系要对齐，冲突时以官方/报错提示为准 |
| `gradient_clipping` | 梯度裁剪 |
| `wall_clock_breakdown` | 调试性能时可开，日常可关 |

**纸面练习：** 打开 GitHub 上任意 `ds_z2_config.json` 与 `ds_z3_config.json`，对比 `zero_optimization` 差在哪几行。

## 怎么选（决策树）

```text
单卡 LoRA 已够用？ → 先别上 DeepSpeed
    │
多卡但仍 OOM / 要更大模型？
    │
    ├─ 先试：降 cutoff_len、batch=1、QLoRA（往往更简单）
    │
    └─ 仍不够或要全参大模型：
           ├─ 显存紧但还能扛 → ZeRO-2
           ├─ 很紧 → ZeRO-3
           └─ 还不够 → ZeRO-3 + offload（接受变慢）
```

入门 LoRA 小模型：**多数情况用不到 ZeRO-3**。先把单卡/简单多卡跑通，再上 DeepSpeed。

## 与第 10 章的关系

- [10-分布式与量化进阶.md](10-分布式与量化进阶.md)：地图（DDP / DeepSpeed / FSDP）
- **本章**：DeepSpeed 配置精读与选型
- FSDP 是另一条分片路线，概念类似「切什么」，API 不同；需要时回官方 Distributed 文档

## 检查点

- [ ] 能用一句话区分 ZeRO-2 与 ZeRO-3
- [ ] 知道 YAML 里用 `deepspeed:` 指向 json
- [ ] 知道 offload 的代价是速度
- [ ] 能说出「小 LoRA 不必一上来 ZeRO-3」

## 常见坑

- batch 相关字段与训练 YAML 不一致导致启动失败
- 多机网络/端口/hostfile 配错（实操期问题）
- 显存其实够却开了 offload，白白变慢
- 把 DeepSpeed 当成「提速开关」——它首先是省显存/扩展规模

## 官方对照

- https://llamafactory.readthedocs.io/zh-cn/latest/advanced/distributed.html
- HF DeepSpeed 说明：https://huggingface.co/docs/transformers/deepspeed

## 下一章

→ [22-多模态专章.md](22-多模态专章.md)
