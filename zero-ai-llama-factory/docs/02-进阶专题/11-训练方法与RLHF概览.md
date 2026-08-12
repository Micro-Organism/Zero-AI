# 11 · 训练方法与 RLHF 概览（选读）

## 本章目标

弄清 `stage` 不只是 `sft`：预训练、偏好对齐、RLHF 家族各自要什么数据、解决什么问题；为以后做 DPO/KTO 打基础。

## 核心概念：训练阶段地图

| stage（常见） | 目标直觉 | 数据直觉 |
|---------------|----------|----------|
| `pt` | 继续学语言/领域文本 | 纯文本 `text` |
| `sft` | 学会按指令回答 | Alpaca / ShareGPT 指令对 |
| `rm` | 训练奖励模型 | 偏好对 chosen/rejected |
| `ppo` | 经典 RLHF 一路 | 依赖奖励模型等，链路更长 |
| `dpo` | 直接用偏好对对齐，省掉部分 RL 复杂 | chosen/rejected |
| `kto` | 用好坏标签对齐 | `kto_tag` true/false |
| `orpo` 等 | 其他对齐变体 | 见官方与示例 |

入门结论：**先 SFT 闭环，再考虑 DPO/KTO**；PPO 全链路最后再碰。

## 为什么要对齐（RLHF 家族）

SFT 解决「会不会按格式做事」；偏好数据解决「哪种回答更好」。

- 有成对好坏回答 → 优先了解 **DPO**（或 ORPO）。
- 只有标量好坏标签 → 了解 **KTO**。
- 要上经典 RL → 再读 **RM + PPO**。

数据格式回顾见 [03-数据准备.md](../01-入门主线/03-数据准备.md) 的偏好 / KTO 小节。

## Step by step（建议学习法，不必一次做完）

1. 用同一基座完成高质量 SFT（领域数据）。
2. 抽一批 prompt，造或标注 chosen/rejected（从小集开始）。
3. 在 `dataset_info.json` 注册偏好数据集（`ranking: true`）。
4. 复制官方 DPO 示例 YAML，改模型、数据、`output_dir`。
5. 对比 SFT-only vs SFT+DPO 的人工盲评（比只看 loss 重要）。
6. 有精力再读 PPO 示例，理解多模型（policy / ref / reward）关系。

## 检查点

- [ ] 能说明 PT / SFT / 偏好对齐的差别
- [ ] 知道 DPO 与 KTO 数据字段不同
- [ ] 不会在没有偏好数据时硬上 DPO

## 常见坑

- 偏好数据质量差或标签噪声大，对齐越训越歪。
- SFT 都没做稳就上 PPO，调试面过大。
- 忘记偏好集要在 `dataset_info.json` 正确声明 `ranking` / columns。

## 官方对照

- 训练方法：https://llamafactory.readthedocs.io/zh-cn/latest/advanced/trainers.html
- 数据处理（偏好/KTO）：https://llamafactory.readthedocs.io/zh-cn/latest/getting_started/data_preparation.html

## 下一章

→ [12-参数速查与监控.md](12-参数速查与监控.md)
