# 23 · NPU 备忘

## 本章目标

整理华为昇腾 NPU 上使用 LLaMA-Factory 的备忘：支持什么、和 GPU 流程哪里一样、环境变量与启动有何不同。供「将来有 NPU 机器」时查阅；无 NPU 也可建立地图。

> 官方入口：  
> https://llamafactory.readthedocs.io/zh-cn/latest/multibackend/npu/index.html  
> 安装：https://llamafactory.readthedocs.io/zh-cn/latest/multibackend/npu/npu_installation.html  
> 训练：https://llamafactory.readthedocs.io/zh-cn/latest/multibackend/npu/npu_training.html

## 支持设备与功能（摘要）

**设备（官方当前表述）：** Atlas A2 / A3 训练系列等（以文档更新为准）。

**功能支持表（概念记忆）：**

| 类别 | 项 | 状态（官方表） |
|------|-----|----------------|
| 训练范式 | PT / SFT / RM / DPO | 已支持 |
| 参数范式 | Full / Freeze / LoRA | 已支持 |
| 合并 | LoRA 合并 | 已支持 |
| 分布式 | DDP / FSDP / FSDP2 / DeepSpeed | 已支持 |
| 加速 | 若干 NPU 融合算子、FA 等 | 部分模型系列 |

备注：NPU 大部分使用方式与 GPU 一致；通用分布式仍参考 Distributed 文档。

## 安装路径（三种）

官方归纳：

1. **手动装环境**（pip / 依赖 / torch-npu 等）
2. **Docker 预装镜像**（入门更省心）
3. **Docker 本地构建**

细节、操作系统与驱动配套以安装页为准。依赖方向记住有 `torch-npu` 这一支。

## 快速开始直觉（Docker 示例逻辑）

1. 按文档 `docker run` 映射 NPU 设备与驱动目录（设备节点名以机器为准）。
2. 进入容器后 **先** `source` Ascend toolkit 的 `set_env.sh`，否则可能认不到 NPU。
3. 再 `llamafactory-cli train examples/...yaml`。

模型下载：HF 不畅时用 ModelScope，例如：

```bash
export USE_MODELSCOPE_HUB=1
```

受限资源可能还需 `ms_hub_token`（勿写入仓库）。

## 和 GPU 最关键的环境变量差异

| GPU 常见 | NPU 对应 |
|----------|----------|
| `CUDA_VISIBLE_DEVICES` | `ASCEND_RT_VISIBLE_DEVICES` |
| （多机网卡另议） | 多机常需 `HCCL_SOCKET_IFNAME`（如 `eth0`） |

不设 `ASCEND_RT_VISIBLE_DEVICES` 时，往往尝试用当前节点 **所有** NPU。

单机多卡示例逻辑：

```bash
ASCEND_RT_VISIBLE_DEVICES=0,1,2,3 llamafactory-cli train examples/train_lora/qwen3_lora_sft.yaml
```

## 多机（备忘）

官方更推荐 NPU 上用 `accelerate launch` + FSDP 做多机；需配置：

- `num_machines` / `num_processes`
- `main_process_ip` / `main_process_port`
- 每机不同的 `machine_rank`
- `HCCL_SOCKET_IFNAME`

具体 yaml 见上游 `examples/accelerate/`。

## 调参与性能（与 GPU 同思路）

优先旋钮仍是：

- `per_device_train_batch_size`
- `gradient_accumulation_steps`
- `cutoff_len`
- `gradient_checkpointing`

偏「先跑通」示例直觉：`batch=1`、加大累积、合理 `cutoff_len`、需要时开 gradient checkpointing。

### 融合算子（了解）

文档提到可通过如 `use_v1_kernels: true`、`flash_attn: fa2` 等启用 NPU/FA 融合；支持的模型系列有限（常见表述含 Qwen3 家族等），以官方表为准。

另可设：

```bash
export TASK_QUEUE_ENABLE=2
```

优化算子下发（官方推荐 Level 2）。

## 检查点

- [ ] 知道 NPU 用 `ASCEND_RT_VISIBLE_DEVICES` 而不是 CUDA 变量
- [ ] 知道容器内要先加载 Ascend 环境脚本
- [ ] 知道功能上 PT/SFT/LoRA/DPO 等已支持，细节看官方表
- [ ] 能说明：无 NPU 时本章仅作地图，实操以安装/训练页为准

## 常见坑

- 忘记 `set_env.sh`，设备数为 0
- 多机未设 HCCL 网卡名
- 把 GPU 博客命令原样粘贴（`CUDA_*`）
- 融合算子对当前模型不适用却强开

## 官方对照

- NPU 索引 / 安装 / 训练三页（文首链接）
- 分布式通论：https://llamafactory.readthedocs.io/zh-cn/latest/advanced/distributed.html

## 返回

→ [10-分布式与量化进阶.md](10-分布式与量化进阶.md)｜总览见 `docs/README.md`
