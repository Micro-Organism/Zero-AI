# 20 · 模型与 template 选型

## 本章目标

建立选型直觉：第一次实验选多大模型、选 Chat/Instruct 还是 Base、`template` 怎么跟模型族对齐——仍以官方当前列表为准，本页给思维框架。

## 一、第一次实验怎么选模型

| 维度 | 概念期 / 第一次云端建议 |
|------|-------------------------|
| 规模 | 优先 **较小 Instruct**（约 1B～8B 档），先跑通再加大 |
| 类型 | 优先 **Instruct / Chat**，少选纯 Base（Base 更偏续写，要更多对齐成本） |
| 许可 | 确认商用/研究许可是否允许你的用途 |
| 语言 | 中文任务优先选中文能力较好的系列（如 Qwen 等，以评测与社区经验为参考） |
| 多模态 | 文本 SFT 先别上 VL；VL 有单独 template 与数据字段 |

对照显存：[17-显存与规模估算.md](17-显存与规模估算.md)。

## 二、`template` 是什么

`template` 决定如何把「系统提示 / 用户 / 助手」等包装成模型认识的特殊 token 序列。

- **必须与模型族匹配**（官方硬要求）。
- 同系列也可能有变体（例如是否含「思考」段、nothink 等）——以仓库内该模型推荐值为准。
- WebUI 通常选模型后会带默认模板；YAML 则需自己写对。

## 三、怎么查「该用哪个 template」（实操前必会）

概念期记住查找顺序即可：

1. 官方文档 [模型支持](https://llamafactory.readthedocs.io/zh-cn/latest/advanced/model_support.html)
2. 仓库 `examples/` 里同模型家族的示例 YAML（看它们的 `template:`）
3. README / 讨论区对应该模型的说明
4. 仍不确定：先用示例原封不动的一对 `(model_name_or_path, template)` 冒烟，再替换自己的数据

**不要**从过时博客抄一组「万能 template」。

## 四、常见对应关系（直觉，非完整表）

> 名称随版本变化；下表只帮助建立「一族一个习惯名前缀」的印象。**以你打开的 examples 为准。**

| 模型族（例子） | template 名称直觉 |
|----------------|-------------------|
| Llama 3 系 | 常见含 `llama3` |
| Qwen2 / Qwen3 系 | 常见含 `qwen` / `qwen3` 及变体（如 nothink） |
| ChatGLM 系 | 常见含 `chatglm` 等 |
| Gemma 系 | 常见含 `gemma` |
| 多模态 VL | 常见单独 `*_vl` 一类模板 |

换模型 = 至少同时检查：`model_name_or_path` + `template`（+ 分词器是否随模型来）。

## 五、Base vs Instruct 再强调

| | Base | Instruct/Chat |
|--|------|----------------|
| 强项 | 续写、再预训练/大规模 SFT 的起点 | 开箱更会遵循指令 |
| 入门 SFT | 可以，但往往更费数据与对齐 | **更推荐当第一站** |
| 风险 | 对话格式要靠你的数据与模板硬造 | 选错模板仍会乱 |

## 六、纸面练习

1. 假设云端只有 16GB 显存、任务是中文客服话术：写你的模型规模选择 + 是否 QLoRA + 理由。  
2. 若从 Qwen Instruct 换成 Llama 3 Instruct，YAML 里你会强制核对哪两个字段？  
3. 为什么说「template 选错时，loss 仍可能下降」？

## 检查点

- [ ] 能说明为何入门优先小 Instruct + 官方示例一对 (model, template)
- [ ] 知道查 template 的正确顺序（文档 → examples → 再社区）
- [ ] 换模型时会同步检查 template

## 官方对照

- 模型支持：https://llamafactory.readthedocs.io/zh-cn/latest/advanced/model_support.html
- 示例目录：https://github.com/hiyouga/LLaMA-Factory/tree/main/examples

## 相关

- 诊断：[19-训练效果诊断.md](19-训练效果诊断.md)
- 自测：[18-自我检测题.md](18-自我检测题.md)
- 回到总路线：[00-学习路线图.md](../00-总览/00-学习路线图.md)
