# zero-ai-study 学习路径（Step by Step）

> 对应工程：仓库根目录 `zero-ai-study/`  
> 路线：纯 Python + Kaggle/Colab + Hugging Face + Unsloth  
> 不含 Spring AI  
> 推荐阅读：[`推荐阅读.md`](./推荐阅读.md)  
> 本地+云端怎么训：[`本地写代码-云端微调.md`](./本地写代码-云端微调.md)

---

## 学习看板（可选并行使用）

前后端已就绪时可打开 Web 看板跟踪进度：

- 前端：http://localhost:5173
- 后端：http://localhost:8000/docs
- 设计：`docs/web-app-design.md`

```bash
# 后端
conda activate base
cd app && PYTHONPATH=src uvicorn study_api.main:app --host 0.0.0.0 --port 8000

# 前端
cd web && pnpm dev
```

---

## Step 0 — 环境与账号（00-setup）

**目标：** 能登录 HF / Kaggle，本机脚本不报关键配置错误。

1. 注册/登录 Hugging Face，创建 Token（Read）  
2. `cp .env.example .env`，填入 `HF_TOKEN`  
3. `pip install -r requirements.txt`  
4. 运行 `python 00-setup/check_env.py`  
5. 打开 Kaggle，新建 Notebook，确认能选 GPU  

**完成标志：** `check_env.py` 通过；Kaggle 能看到 GPU。

→ 完成后进入 Step 1。

---

## Step 1 — 概念（01-concepts）

**目标：** 不写训练代码也能讲清链路。

阅读并勾选 `01-concepts/README.md` 中的清单；可选读：

- [CSDN：预训练 / 微调 / 迁移学习](https://blog.csdn.net/weixin_45277161/article/details/131544912)
- [Unsloth：LLM 微调指南](https://unsloth.ai/docs/zh/kai-shi-shi-yong/fine-tuning-llms-guide.md)
- [Unsloth Studio](https://unsloth.ai/docs/zh/xin-zeng/studio.md)（可选无代码路径）

**完成标志：** 用自己的话写满 `01-concepts/notes.md` 五个填空。

→ 完成后进入 Step 2。

---

## Step 2 — 数据（02-data）

**目标：** 看懂指令微调数据长什么样，并能改样例。

1. 阅读 `datasets/sample_alpaca_zh.jsonl`  
2. 按 `02-data/README.md` 增补至少 5 条自己的样本  
3. （可选）了解 ChatML / ShareGPT 与 Alpaca 的差异  

**完成标志：** 样例文件可被 `datasets` 库或后续 Notebook 正常读取。

→ 完成后进入 Step 3。

---

## Step 3 — 微调（03-finetune）【需要 GPU】

**目标：** 云端跑通一次 QLoRA + SFT。

1. 优先 Kaggle：按 `03-finetune/README.md` 上传/粘贴 Notebook 流程  
2. 登录 HF，加载小指令模型（如 Unsloth 提供的 4bit 模型）  
3. 用样例或公开小数据集训练少量 steps（先求跑通，不求效果）  
4. 把适配器下载到本地 `outputs/`（勿提交 Git）  

**完成标志：** 训练 loss 有下降趋势或至少完整跑完；`outputs/` 有适配器文件。

→ 完成后进入 Step 4。

---

## Step 4 — 评估（04-eval）

**目标：** 主观对比「微调前 vs 微调后」。

1. 准备 5～10 条固定测试问题  
2. 记录回复到 `04-eval/eval_log.md`  
3. 判断：是否更贴你的数据风格/领域（有无过拟合胡言）  

**完成标志：** `eval_log.md` 有至少一轮完整记录。

→ 完成后进入 Step 5。

---

## Step 5 — 导出与推理（05-export-infer）

**目标：** 会保存 LoRA；可选导出 GGUF 用 Ollama 试聊。

按 `05-export-infer/README.md` 操作。

**完成标志：** 能在本机或 Notebook 里再次加载适配器对话；或 Ollama 跑通 GGUF（可选加分）。

→ 完成后进入 **进阶路径 Step 6～8**（数据工程 → 参数深挖 → 再训复评）。

---

## 进阶路径（求职向 · 全面掌握后再深挖）

### Step 6 — 数据工程深挖（06-data-craft）

**目标：** 会构建/清洗 Alpaca 数据，训测分离，针对弱项补样本。

看板：http://localhost:5173/data-craft  
完成：训练 ≥500、Holdout ≥100、笔记与面试口述通过校验。

### Step 7 — 训练参数深挖（07-hparams）

**目标：** 讲清 r / alpha / lr / steps / batch / seq / 4bit，并写出 v2 改参计划。

看板：http://localhost:5173/hparams

### Step 8 — 再训与复评（08-retrain）

**目标：** 用新数据+新参数训练 `llama_lora_zh_v2`，对比 v1 弱题，形成可面试讲述的闭环。

看板：http://localhost:5173/retrain  
**建议：先完成本步再开进阶。** 进阶不阻塞 Step 8，但面试故事要先有「v1→数据→超参→v2→对比」闭环。

---

## 进阶路线图（Step 8 之后 · 可选）

> 目标：从「会跑通一轮微调」进到「能设计实验、量化对比、讲清取舍」。不必一次做完；按精力选一条主线。

| 阶段 | 主题 | 做什么 | 产出 / 面试价值 |
|------|------|--------|-----------------|
| **A · 消融** | 只改一个变量 | 固定数据，分别试 steps=60 vs 120；或固定 steps 试 r=8 vs 16 | 一张对比表 + 「为什么不全改」的口述 |
| **B · 自动评测** | 减少手测偏见 | 对 Holdout 100 写简单脚本：关键词/清单覆盖率，或 LLM-as-judge（可选） | 可复现的分数，而不是「感觉更好」 |
| **C · 长尾补数据** | 针对仍弱的题 | 只补产物/对比类 50～100 条，再训小步（如 +40 steps） | 证明「定向补数据」比盲目加大模型更有效 |
| **D · 对齐入门** | DPO / ORPO 概念 | 读 1 篇笔记 + 跑官方小 demo（不必上生产） | 能区分 SFT vs preference 对齐 |
| **E · 作品集** | 交付打磨 | README：问题→数据→训练→评测→失败案例；HF/Kaggle 链接；1 分钟 Demo | 简历一页可讲完的项目 |

**规划建议：**

1. **现在：** 专心 Step 8（上云 → 训 v2 → 弱题对比 → 看板校验）。  
2. **Step 8 通过后优先 A 或 B**（消融或自动评测）——性价比最高，直接强化「实验设计」叙事。  
3. **求职临近再做 E**；D 有余力再碰，不要和 Step 8 并行以免分心。  

看板侧：A～E **暂不强制做新页面**；需要时再开 Step 9+（如 `09-ablation`）。你确认要继续规划落地页时再说一声即可。

### 当前主线（工程满意，优先于消融）

v2/v3 复盘与方案总账：**[09-engineering/triage_v1_v2_v3.md](../09-engineering/triage_v1_v2_v3.md)**  
固定门禁题：**[09-engineering/gate_suite.md](../09-engineering/gate_suite.md)**

1. 已完成：去「落地建议」→ v3（G2/G4 过，G1/G3 未过）  
2. 下一枪数据：`datasets/sample_alpaca_zh_v4.jsonl`（产物簇+QLoRA 簇+无垫片）  
3. 开训前：`python3 02-data/check_v4_ready.py` 必须全绿  
4. 推荐干净重训 `llama_lora_zh_v4` → Gate 双采样全过才算满意  

---

## 卡住时怎么办

| 现象 | 建议 |
|------|------|
| HF 下载失败 | 检查 Token、模型门控协议、网络/镜像 |
| CUDA OOM | 降 `max_seq_length`、batch、换更小模型、确认 QLoRA `load_in_4bit=True` |
| Colab 503 | 换网络或改用 Kaggle |
| Kaggle 无 GPU | 确认账号验证、周配额是否用尽 |

---

## 当前进度（自己打勾）

- [x] Step 0 Setup  
- [x] Step 1 Concepts  
- [x] Step 2 Data  
- [x] Step 3 Finetune  
- [x] Step 4 Eval  
- [x] Step 5 Export / Infer  
- [x] Step 6 Data Craft  
- [x] Step 7 Hparams  
- [x] Step 8 Retrain / Re-eval  
- [ ] Step 9 Engineering（v3 复盘完成；v4 数据已就绪，Gate 双采样后算满意）  
- [ ] （可选）进阶 A～E：见上文「进阶路线图」
