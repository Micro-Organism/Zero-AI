# Step 5 — 导出与推理 Export / Infer

**上一步：** [../04-eval](../04-eval/)  
**下一步：** 回到 [学习路径](../docs/learning-path.md) 打勾完结；或加数据再跑一轮 Step 3

## 本步目标

1. 会保存 / 再加载 **LoRA 适配器**  
2. （可选）导出 **GGUF**，用 **Ollama / llama.cpp / LM Studio** 本机试聊  

本路线 **不对接 Spring AI**。

## LoRA 适配器

Unsloth / PEFT 训练结束后通常得到体积较小的适配器目录。  
保留好：

- 适配器权重  
- 训练时用的基座模型名（加载时要对上）  
- 聊天模板设置  

加载方式以你当时 Notebook 的 `FastLanguageModel.from_pretrained` / `load_adapter` 为准。

## （可选）GGUF → Ollama

1. 按 [Unsloth 保存 GGUF 说明](https://unsloth.ai/docs/zh/ji-chu-zhi-shi/inference-and-deployment/saving-to-gguf.md) 导出  
2. 本机安装 [Ollama](https://ollama.com/)  
3. 用 Modelfile 指向 GGUF 创建本地模型并 `ollama run …`  

GGUF 文件很大，**不要提交 Git**（已在 `.gitignore`）。

## 检查清单

- [ ] 能再次加载适配器并对话  
- [ ] （可选）GGUF + Ollama 跑通  
- [ ] 在 `export_notes.md` 记下导出命令与路径  

```bash
cp 05-export-infer/export_notes.template.md 05-export-infer/export_notes.md
```

## 完成标准

- [ ] 微调产物可复现加载  
- [ ] 学习路径 Step 0～5 全部勾选  
