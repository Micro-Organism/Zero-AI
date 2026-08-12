# Step 3 — 微调 Finetune（需要 GPU）

**上一步：** [../02-data](../02-data/)  
**下一步：** [../04-eval](../04-eval/)

## 本步目标

在 **Kaggle** 用 **Unsloth + QLoRA + SFT** 跑通一次训练。  
本机无独显也可以：真正训练在云端完成。

**完整流程总览：** [`../docs/本地写代码-云端微调.md`](../docs/本地写代码-云端微调.md)

---

## 现在只做这一小步：导入官方 Notebook（约 5 分钟）

不要自己在 GitHub 仓库里「挑文件」。  
Unsloth 已经提供了 **一键打开 Kaggle** 的链接，点下面这个就行：

### 推荐笔记本（入门首选）

**Llama 3.1 (8B) · Alpaca · SFT（官方 Kaggle 版）**

👉 直接点开：  
https://www.kaggle.com/notebooks/welcome?src=https%3A%2F%2Fgithub.com%2Funslothai%2Fnotebooks%2Fblob%2Fmain%2Fnb%2FKaggle-Llama3.1_%288B%29-Alpaca.ipynb

备选（同样是 7B 级、官方 Kaggle 版）：  
https://www.kaggle.com/notebooks/welcome?src=https%3A%2F%2Fgithub.com%2Funslothai%2Fnotebooks%2Fblob%2Fmain%2Fnb%2FKaggle-Qwen2.5_%287B%29-Alpaca.ipynb

说明页（可选阅读）：  
https://unsloth.ai/docs/get-started/unsloth-notebooks

---

### 操作清单（按顺序勾）

1. **登录** Kaggle（账号 `coolrabbit1993`）
2. **点上面的推荐链接**（浏览器会跳到 Kaggle，并带上官方 Notebook）
3. 页面出现后，点 **Copy and Edit**（或「创建 / 复制笔记本」同类按钮）
   - 若提示保存到自己的账号，选确认
   - 可以改名成：`zero-unsloth-llama31-8b`
4. 打开后进右侧 **Settings / Session options**：
   - **Accelerator** → **GPU T4 x2**（没有选项就先做手机验证）
   - **Internet** → **On**（必须开，否则装不了包 / 下不了模型）
5. 确认 **Add-ons → Secrets** 里已有 `HF_TOKEN`（Step 0 做过）
6. 在笔记本**最上面新增一个单元格**，粘贴并先单独 Run 一次：

```python
import os
from kaggle_secrets import UserSecretsClient
os.environ["HF_TOKEN"] = UserSecretsClient().get_secret("HF_TOKEN")
from huggingface_hub import login
login(token=os.environ["HF_TOKEN"])
```

7. 在笔记本里用搜索（Ctrl/Cmd + F）找 `max_steps`，先改成 **60**（只求跑通）
8. 菜单 **Run → Run All**（或点顶部 Run All）
9. 等训练跑完：能看到 loss 在打印、最后没有红字报错 → **本小步成功**

### 先不要做的事

- 先不要换自己的 `sample_alpaca_zh.jsonl`（下一小步再做）
- 先不要改成 70B / Vision / GRPO 笔记本
- 先不要把 `max_steps` 拉到几千

---

## 跑通之后你回我什么

发这 4 项即可，我带你进入「换成自己的数据」：

1. GPU：是否显示 T4  
2. 模型名：例如 `unsloth/Meta-Llama-3.1-8B-...`  
3. 大概最终 loss  
4. 有没有报错（有的话贴最后 20 行）

本机记录文件：[`finetune_run_log.md`](./finetune_run_log.md)

---

## 入门参数建议（先求跑通）

| 项 | 建议 |
|----|------|
| 方法 | QLoRA（`load_in_4bit=True`） |
| 模型 | Llama 3.1 8B（官方 Notebook） |
| max_seq_length | 先 1024 或 2048 |
| max_steps | 先 60 |
| batch | 小 batch + gradient_accumulation |

OOM 时：减小序列长度 / batch。

## 完成标准（整步）

- [ ] 至少一次成功的云端 SFT（可先用官方公开数据）
- [ ] `finetune_run_log.md` 已填写
- [ ] （下一小步）换成自己的 jsonl 再训一轮并下载适配器到 `outputs/`
