# PyTorch 技术路线

> 一句话定位：不只会调 Trainer，而是能独立实现、调试、加速和恢复模型训练。

## 快速概览

| 能力 | 初级 | 达标 |
|---|---|---|
| Tensor | 会创建/运算 | 能跟踪 dtype、shape、stride、device 和广播 |
| Autograd | 会 `backward()` | 能定位 detach、原地操作、梯度累积与 NaN |
| Data | 会 DataLoader | 能设计 Dataset/collate/sampler/padding 与可复现加载 |
| Training | 会跑 demo | 能写 train/eval/checkpoint/resume/AMP 闭环 |
| Debug | 只降 batch | 能分析 OOM、吞吐、梯度和数据瓶颈 |

## 学习地图（表格）

| Step | 主题 | 验收动作 |
|---:|---|---|
| 1 | Tensor/dtype/device/shape | 修复 5 个 shape/device 错误 |
| 2 | autograd/计算图 | 与手算/数值梯度对比 |
| 3 | `nn.Module`/参数注册 | 实现 MLP 和自定义 layer |
| 4 | Dataset/DataLoader/collate | 处理变长文本或图像 |
| 5 | train/eval loop | 正确处理 mode、grad、metric |
| 6 | checkpoint/AMP/GPU | 恢复 optimizer/scheduler/scaler |
| 7 | profiler/distributed concepts | 找出一个数据或计算瓶颈 |

## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | Tensor、dtype、shape、broadcast、device | 表示与执行模型计算 | NumPy、线代 | 能追踪 shape/device 并避免隐式错误 | `02`、`04` |
| 必会 | autograd、computation graph、detach/no_grad | 自动微分与梯度控制 | 链式法则 | 能检查 grad 并解释图释放 | `04` |
| 必会 | nn.Module、parameter、state_dict、init | 组织模型和持久化状态 | OOP、网络层 | 能实现 MLP/CNN/RNN 模块 | `04` |
| 必会 | Dataset/DataLoader、collate、sampler | 批处理和可扩展数据输入 | Python 迭代器 | 能处理变长样本与多进程加载 | `19` |
| 必会 | train/eval loop、optimizer、scheduler、AMP | 完整训练验证闭环 | loss/优化 | 能从零训练、验证和恢复 | `14` |
| 进阶 | hook、profiler、compile、custom autograd | 调试中间状态和性能 | 计算图 | 能定位时间/显存瓶颈 | `16` |
| 进阶 | DDP、FSDP、distributed sampler/checkpoint | 多卡同步与状态分片 | GPU/进程 | 能解释切分对象并做恢复实验 | `09`、`16` |
| 了解 | TorchScript/export/ONNX、quantization APIs | 跨运行时部署和压缩 | 模型服务 | 能验证导出前后输出与性能 | `15-16` |

## 纵向：从原理到交付的完整闭环

```text
Dataset -> DataLoader/collate -> model.to(device) -> forward/autocast -> loss
        -> scale/backward -> unscale/clip -> optimizer -> scheduler
        -> validation(no_grad/inference_mode) -> checkpoint -> resume/export
```

| 必查项 | 正确做法 | 错误后果 |
|---|---|---|
| `model.train/eval` | 训练/验证显式切换 | dropout/norm 行为错 |
| `zero_grad` | 每次更新前清理，累积时例外 | 梯度意外累积 |
| metric | detach 后统计，不把整图保留 | 显存增长 |
| checkpoint | model + optimizer + scheduler + step + scaler | 恢复后轨迹不一致 |
| seed | Python/NumPy/Torch/DataLoader 统一管理 | 实验无法比较 |

## 横向：与其他技术的连接

- **Hugging Face**：Transformers Trainer 封装 PyTorch 循环；出问题时必须能回到 Tensor/Module/optimizer 层。
- **Unsloth/LLaMA Factory**：加速框架改变 kernel/数据流，不改变损失、梯度和评测基本逻辑。
- **CV/NLP**：Dataset/collate 不同，训练骨架共用。
- **分布式**：DDP/FSDP/DeepSpeed 建立在单卡循环正确和可复现之上。

## 技术对比与选型

| 框架 | 优势 | 限制 | 建议 |
|---|---|---|---|
| PyTorch | 动态、研究/开源生态强 | 容易写出隐性状态 | 主线深挖 |
| TensorFlow/Keras | 成熟部署生态和高层 API | 当前 LLM 开源社区占比较低 | 能阅读，按岗位再深挖 |
| PaddlePaddle | 国内产业和 PaddleNLP 生态 | 全球 LLM 社区小于 PyTorch | 目标项目使用时学 |
| JAX | 函数式变换与 TPU/XLA | 学习模式不同 | 研究/特定基础设施后置 |

## Step by Step

1. 不用 Trainer 写一个分类训练/验证循环。
2. 自定义 Dataset 和 collate，处理变长输入及 padding mask。
3. 加入 config、seed、日志、最佳/最新 checkpoint 与 resume。
4. GPU 上加 AMP，比较显存、吞吐与指标。
5. 制造 shape mismatch、device mismatch、NaN、OOM 各一次并写诊断笔记。
6. 将模型导出为可独立加载的推理函数，用固定样本回归。

## 最小项目与验收标准

**项目：可恢复的 PyTorch 训练模板**

| 验收项 | 过关标准 |
|---|---|
| 数据 | Dataset/collate 有单测，批次 shape/mask 正确 |
| 训练 | train/eval mode、AMP、clip、scheduler 顺序正确 |
| 恢复 | 中断后能从 step/optimizer/scheduler 继续 |
| 诊断 | 记录 loss、lr、grad norm、显存和吞吐 |
| 推理 | 独立加载 checkpoint，固定输入结果可回归 |

## 常见误区与面试达标

- 误区：验证时忘记 `eval()` 或仍保留梯度图。
- 误区：只保存 model weights，却声称能无损恢复训练。
- 面试达标：能说明 `requires_grad`、`no_grad`、`inference_mode`、`detach` 的差异。
- 面试达标：能按参数、梯度、optimizer state、activation 拆显存。

## 下一步

进入 [06-NLP 技术路线](../02-模型与方向/06-NLP技术路线.md)，并保留对 [07-CV 路线](../02-模型与方向/07-CV技术路线.md) 的分支入口。
