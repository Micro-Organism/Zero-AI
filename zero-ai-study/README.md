# zero-ai-study

纯 **Python** 大模型微调学习工程（与仓库内 Spring AI / Java 模块无关）。

按阶段 **step by step** 推进：概念 → 环境 → 数据 → Unsloth 微调 → 评估 → 导出推理。

## 学习顺序（请严格按序）

| 步骤 | 目录 | 你要完成什么 | 是否需要 GPU |
|------|------|--------------|--------------|
| 0 | [00-setup](00-setup/) | 账号、Token、本机依赖、GPU 环境确认 | 检查时需要（Kaggle/Colab） |
| 1 | [01-concepts](01-concepts/) | 搞清预训练 / 微调 / LoRA / QLoRA / SFT | 否 |
| 2 | [02-data](02-data/) | 看懂指令数据格式，改/扩样例数据 | 否 |
| 3 | [03-finetune](03-finetune/) | 在 Kaggle 或 Colab 跑通一次 QLoRA SFT | **是** |
| 4 | [04-eval](04-eval/) | 对比微调前后回复，记录结论 | 推理可用 CPU/小 GPU |
| 5 | [05-export-infer](05-export-infer/) | 导出 LoRA /（可选）GGUF，本机试用 | 可选 |

更细的清单见：[docs/learning-path.md](docs/learning-path.md)  
仓库级需求背景：[../docs/01-需求分析/需求分析.md](../docs/01-需求分析/需求分析.md)

## 算力（推荐）

1. **Kaggle**（优先）：账号 `gaizkakilig`，免费 P100，周约 30h GPU  
   https://www.kaggle.com/
2. **Google Colab**（备选）：免费 T4；注意 IP/503  
   https://colab.research.google.com/

## 你需要准备的账号

- [ ] Kaggle
- [ ] [Hugging Face](https://huggingface.co/) + [Access Token](https://huggingface.co/settings/tokens)（至少 Read）
- [ ] （可选）Google 账号用于 Colab

把 Token 放到本地 `.env`（从 `.env.example` 复制），**不要提交真 Token**。

## 本机快速开始（仅 setup / 概念 / 数据阶段）

```bash
cd zero-ai-study
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # 编辑填入 HF_TOKEN
python 00-setup/check_env.py
```

## 学习看板（Web + API）

查看进度 / 运行检查 / 执行效果：

```bash
# 后端（conda base + 清华镜像）
conda activate base
cd app
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
PYTHONPATH=src uvicorn study_api.main:app --reload --host 0.0.0.0 --port 8000

# 前端（另开终端）
cd web
pnpm install --registry=https://registry.npmmirror.com
pnpm dev
```

打开 http://localhost:5173 ；设计见 [docs/web-app-design.md](docs/web-app-design.md)。  
推荐阅读：[docs/推荐阅读.md](docs/推荐阅读.md)  
**本地写 + 云端训：** [docs/本地写代码-云端微调.md](docs/本地写代码-云端微调.md)

真正训练请打开 `03-finetune/` 的说明，在 **Kaggle/Colab** 里装 Unsloth 再跑。

## 目录说明

```text
zero-ai-study/
├── 00-setup/ … 05-export-infer/   # 分阶段学习
├── datasets/                      # 可提交的小样例数据
├── outputs/                       # 训练产物（gitignore，勿提交大文件）
├── docs/learning-path.md
├── requirements.txt
└── .env.example
```

## 本轮过关标准

1. 能口述：预训练、微调、LoRA、QLoRA、SFT  
2. 云端跑通一次 Unsloth 微调（公开或本仓库样例数据）  
3. 保存适配器，并留下微调前后对比记录  
4. 按本 README，别人能跟上你的步骤  

## 明确不做

- Spring AI / `zero-ai-alibaba` / `zero-ai-boot` 对接  
- 从零预训练大模型、多卡 FFT（入门阶段）
