# Step 0 — 环境与账号 Setup

**上一步：** 无（从这里开始）  
**下一步：** [../01-concepts](../01-concepts/)

## 本步目标

1. Hugging Face Token 可用  
2. 本机 Python 依赖可装  
3. 明确真正训练在 **Kaggle（推荐）或 Colab** 上跑  

## 操作清单

1. 打开 https://huggingface.co/settings/tokens 创建 Token（Read）  
2. 在工程根目录：

```bash
cd zero-ai-study
cp .env.example .env
# 编辑 .env，填入 HF_TOKEN
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python 00-setup/check_env.py
```

3. Kaggle：登录 → Create Notebook → Accelerator 选 GPU  
4. （可选）Colab：Runtime → Change runtime type → GPU；若 503 则回 Kaggle  

## 云端 Secrets 建议

| 平台 | 做法 |
|------|------|
| Kaggle | Add-ons → Secrets → `HF_TOKEN` |
| Colab | 钥匙图标 Secrets，或 `userdata.get('HF_TOKEN')` |

## 完成标准

- [ ] `check_env.py` 输出通过  
- [ ] 已能打开带 GPU 的 Kaggle/Colab Notebook  
- [ ] **没有**把真实 Token 提交到 Git  
