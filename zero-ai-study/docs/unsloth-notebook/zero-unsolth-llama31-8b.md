# zero-unsloth-llama31-8b · 全程说明（你跑过的 Notebook）

> 本文是对 Kaggle Notebook `zero-unsloth-llama31-8b` 的**注释版存档**。  
> **原有代码全部保留**，只增加章节、目的说明和你实际踩过的坑。  
> 对应前端：http://localhost:5173/finetune（Step 3）

---

## 0. 先回答你两个问题

### 0.1 从头跑到推理输出，算不算「完成一次过程」？

**算完成了 Step 3 的「云端通路跑通」这一轮（小步 A～B）。**

你已经走完这条最小闭环：

1. 准备 Token / GPU / Internet  
2. 安装 Unsloth 环境  
3. 加载 4bit 基座模型  
4. 挂上 LoRA（PEFT）  
5. 用公开 Alpaca 数据做格式化  
6. `max_steps = 60` 监督微调（SFT）  
7. 推理试了一句斐波那契，回答合理  

这证明：**Kaggle + HF + Unsloth + QLoRA + SFT + 推理** 整条链是通的。

### 0.2 还不算「整条微调学习完全结束」的部分

| 项 | 你现在 | 说明 |
|----|--------|------|
| 用自己的中文数据再训 | 未做 | 下一小步（Step 3 后半） |
| 把 `llama_lora` 下载到本机 `outputs/` | 看你是否跑了保存格 | 建议补做 |
| 填写 `03-finetune/finetune_run_log.md` | 建议补填 | 求职/复习用 |
| Step 4 评估、Step 5 导出 GGUF/Ollama | 未开始 | 后面再做 |

文档末尾 **「接下来怎么 step by step」** 会告诉你下一刀切哪里。

---

## 1. 你到底做了什么（一张图）

```text
HF Token 就绪
    ↓
安装 torch / unsloth / 修正 transformers 版本
    ↓
加载 4bit 基座：unsloth/Llama-3.1-8B-bnb-4bit
    ↓
挂 LoRA 适配器（只训少量参数）
    ↓
把公开数据集 format 成 Alpaca 文本
    ↓
SFTTrainer 训练 60 steps
    ↓
推理试聊（斐波那契）→ 成功
    ↓
（建议）保存 llama_lora / 记录日志 / 换自己的数据再训
```

**一句话：** 基座模型几乎不动，只训练一块「小补丁」（LoRA）；训完后模型更会按 Alpaca 指令格式回答。

---

## 2. 环境与账号准备（Notebook 之前）

这些不在下面代码里，但你已经做过：

1. 从 Unsloth 官方 Kaggle 链接 **Copy and Edit** 出 `zero-unsloth-llama31-8b`  
2. Settings → Accelerator = **GPU T4 x2**  
3. Settings → **Internet = On**（在顶栏 Settings，不在右侧 Input）  
4. Add-ons → Secrets 配置 **`HF_TOKEN`**

---

## 3. 章节 A · 登录 Hugging Face

**目的：** 让 Notebook 能下载 Unsloth / HF 上的模型与数据集。  
**你踩过的坑：** 若同时 `os.environ["HF_TOKEN"]=...` 又 `login(token=...)`，会出 Note 提示；下面这版可避免警告。

```python
import os
from kaggle_secrets import UserSecretsClient

# 若 Kaggle 已注入 HF_TOKEN 就直接用；没有再从 Secrets 读取
if not os.environ.get("HF_TOKEN"):
    os.environ["HF_TOKEN"] = UserSecretsClient().get_secret("HF_TOKEN")

print("HF_TOKEN ready:", bool(os.environ.get("HF_TOKEN")))
```

**怎么判断成功：** 打印 `HF_TOKEN ready: True`。

---

## 4. 章节 B · 安装依赖

**目的：** 装上 PyTorch、Unsloth、TRL 等训练库。  
`%%capture` 会把安装日志藏起来，看起来像没输出，等左侧转圈结束即可。

```python
%%capture
import os

!pip install pip3-autoremove
!pip install torch torchvision torchaudio xformers --index-url https://download.pytorch.org/whl/cu128
!pip install unsloth
!pip install --no-deps --upgrade "torchao>=0.16.0"
!pip install transformers==4.56.2
!pip install --no-deps trl==0.22.2

print("Success ~~~")
```

---

## 5. 章节 C · 修正 transformers 版本（你踩过的大坑）

**现象：** 加载模型时报  
`additional_chat_templates does not exist on "main"`（404）。  
**原因：** 不是模型名错了，是旧版 `transformers` / `huggingface_hub` 把「可选目录不存在」当成致命错误。  
**注意：** 不能装太新（例如 5.14.1），会和 Unsloth 冲突。你最终用的是 **`transformers==4.57.1`**。  
**装完必须 Restart Session**，再重跑 Token 格和后面的格。

```python
!pip install -U "transformers==4.57.1" "huggingface_hub>=0.34.0" -q
import transformers, huggingface_hub
print("transformers", transformers.__version__)
print("huggingface_hub", huggingface_hub.__version__)
print("ok, now restart session")
```

**不需要清华镜像**也能装；镜像只影响速度，不解决版本兼容。

---

## 6. 章节 D · 加载 4bit 基座模型（QLoRA 的「Q」）

**目的：** 把 Llama 3.1 8B 以 **4bit 量化**方式加载进 T4 显存，否则免费 GPU 很容易 OOM。  
**你最终用的模型：** `unsloth/Llama-3.1-8B-bnb-4bit`  
（中间试过 `Meta-Llama-3.1-8B-Instruct-bnb-4bit`，在修版本前都会因模板 404 失败。）

```python
from unsloth import FastLanguageModel
import torch
max_seq_length = 2048 # Choose any! We auto support RoPE Scaling internally!
dtype = None # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
load_in_4bit = True # Use 4bit quantization to reduce memory usage. Can be False.

# # 4bit pre quantized models we support for 4x faster downloading + no OOMs.
# fourbit_models = [
#     "unsloth/Llama-3.1-8B-bnb-4bit",      # Llama-3.1 15 trillion tokens model 2x faster!
#     "unsloth/Llama-3.1-8B-Instruct-bnb-4bit",
#     "unsloth/Llama-3.1-70B-bnb-4bit",
#     "unsloth/Llama-3.1-405B-bnb-4bit",    # We also uploaded 4bit for 405b!
#     "unsloth/Mistral-Nemo-Base-2407-bnb-4bit", # New Mistral 12b 2x faster!
#     "unsloth/Mistral-Nemo-Instruct-2407-bnb-4bit",
#     "unsloth/mistral-7b-v0.3-bnb-4bit",        # Mistral v3 2x faster!
#     "unsloth/mistral-7b-instruct-v0.3-bnb-4bit",
#     "unsloth/Phi-3.5-mini-instruct",           # Phi-3.5 2x faster!
#     "unsloth/Phi-3-medium-4k-instruct",
#     "unsloth/gemma-2-9b-bnb-4bit",
#     "unsloth/gemma-2-27b-bnb-4bit",            # Gemma 2x faster!
# ] # More models at https://huggingface.co/unsloth

print("Start ~~~ model loaded")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.1-8B-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
    # token = "YOUR_HF_TOKEN", # HF Token for gated models
)

print("Sucess ~~~ model loaded ")
```

**关键参数白话：**

| 参数 | 含义 |
|------|------|
| `max_seq_length=2048` | 一条样本最多看多长上下文 |
| `load_in_4bit=True` | 4bit 量化，省显存 |
| `model_name=...bnb-4bit` | 直接用 Unsloth 预量化权重，下载更快 |

---

## 7. 章节 E · 挂上 LoRA（QLoRA 的「LoRA」）

**目的：** 冻结大模型主体，只训练少量适配器参数。  
**成功标志（不是报错）：**  
`Unsloth ... patched 32 layers with 32 QKV layers...`  
表示 32 层都挂上了 LoRA。

```python
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Choose any number > 0 ! Suggested 8, 16, 32, 64, 128
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0, # Supports any, but = 0 is optimized
    bias = "none",    # Supports any, but = "none" is optimized
    # [NEW] "unsloth" uses 30% less VRAM, fits 2x larger batch sizes!
    use_gradient_checkpointing = "unsloth", # True or "unsloth" for very long context
    random_state = 3407,
    use_rslora = False,  # We support rank stabilized LoRA
    loftq_config = None, # And LoftQ
)
```

**白话：** `r=16` 是适配器「容量」；越大越能学复杂模式，也更吃显存。入门 16 合适。

---

## 8. 章节 F · 准备训练数据（Alpaca 格式）

**目的：** 把每条样本拼成模型要学的文本，并加上结束符 `EOS_TOKEN`。  
**数据来源：** 公开集 `unsloth/alpaca-cleaned`（**还不是**你本机的 `sample_alpaca_zh.jsonl`）。

```python
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token # Must add EOS_TOKEN
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        # Must add EOS_TOKEN, otherwise your generation will go on forever!
        text = alpaca_prompt.format(instruction, input, output) + EOS_TOKEN
        texts.append(text)
    return { "text" : texts, }

from datasets import load_dataset
dataset = load_dataset("unsloth/alpaca-cleaned", split = "train")
dataset = dataset.map(formatting_prompts_func, batched = True,)
```

这和你在前端「训练数据」页维护的字段是同一套思想：`instruction` / `input` / `output`。

---

## 9. 章节 G · 配置训练器（SFT）

**目的：** 用 TRL 的 `SFTTrainer` 做监督微调。  
**你改过的关键项：** `max_steps = 60`（先求跑通，不要一上来几千步）。

```python
from trl import SFTConfig, SFTTrainer
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    packing = False, # Can make training 5x faster for short sequences.
    args = SFTConfig(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        # num_train_epochs = 1, # Set this for 1 full training run.
        max_steps = 60,
        learning_rate = 2e-4,
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.001,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
        report_to = "none", # Use TrackIO/WandB etc
    ),
)
```

**有效 batch 大约：** `2 × 4 = 8`（per_device × gradient_accumulation）。

---

## 10. 章节 H · 看显存 → 开训 → 再看耗时

### 10.1 训练前显存

```python
# @title Show current memory stats
gpu_stats = torch.cuda.get_device_properties(0)
start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
print(f"GPU = {gpu_stats.name}. Max memory = {max_memory} GB.")
print(f"{start_gpu_memory} GB of memory reserved.")
```

### 10.2 真正训练（最关键的一格）

```python
trainer_stats = trainer.train()
```

这里会滚动打印 `loss`。能完整跑完 60 steps 就是训练成功。

### 10.3 训练后统计

```python
# @title Show final memory and time stats
used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
used_memory_for_lora = round(used_memory - start_gpu_memory, 3)
used_percentage = round(used_memory / max_memory * 100, 3)
lora_percentage = round(used_memory_for_lora / max_memory * 100, 3)
print(f"{trainer_stats.metrics['train_runtime']} seconds used for training.")
print(
    f"{round(trainer_stats.metrics['train_runtime']/60, 2)} minutes used for training."
)
print(f"Peak reserved memory = {used_memory} GB.")
print(f"Peak reserved memory for training = {used_memory_for_lora} GB.")
print(f"Peak reserved memory % of max memory = {used_percentage} %.")
print(f"Peak reserved memory for training % of max memory = {lora_percentage} %.")
```

#### 实测结果（你本轮）

```text
351.3431 seconds used for training.
5.86 minutes used for training.
Peak reserved memory = 7.275 GB.
Peak reserved memory for training = 0.568 GB.
Peak reserved memory % of max memory = 49.959 %.
Peak reserved memory for training % of max memory = 3.901 %.
```

**怎么读：**

- 训练大约 **5.86 分钟**（60 steps）  
- 峰值占用约 **7.3 GB**，大概半卡显存  
- 相对「训练前已占用」，训练额外大约 **0.57 GB**（LoRA 很省）  
- **最终 loss：`0.885100`**（训练日志最后一行）

实验记录请在前端「云端微调」页填写/保存/校验（会自动同步 `03-finetune/finetune_run_log.md`），不要手改 md 为主。

---

## 11. 章节 I · 推理试聊（你已成功）

**目的：** 确认微调后的模型能按 Alpaca 模板生成。

### 11.1 非流式推理（`batch_decode`）

```python
# alpaca_prompt = Copied from above
FastLanguageModel.for_inference(model) # Enable native 2x faster inference
inputs = tokenizer(
[
    alpaca_prompt.format(
        "Continue the fibonacci sequence.", # instruction
        "1, 1, 2, 3, 5, 8", # input
        "", # output - leave this blank for generation!
    )
], return_tensors = "pt").to("cuda")

outputs = model.generate(**inputs, max_new_tokens = 64, use_cache = True)
tokenizer.batch_decode(outputs)
```

#### 实测结果（I）

```text
['<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.\n\n### Instruction:\nContinue the fibonacci sequence.\n\n### Input:\n1, 1, 2, 3, 5, 8\n\n### Response:\n13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025']
```

**说明：** `8` 后面续写 `13, 21, 34, 55...` 符合斐波那契，**通路成功的关键证据。**

### 11.2 流式推理（`TextStreamer`）

```python
# alpaca_prompt = Copied from above
FastLanguageModel.for_inference(model) # Enable native 2x faster inference
inputs = tokenizer(
[
    alpaca_prompt.format(
        "Continue the fibonacci sequence.", # instruction
        "1, 1, 2, 3, 5, 8", # input
        "", # output - leave this blank for generation!
    )
], return_tensors = "pt").to("cuda")

from transformers import TextStreamer
text_streamer = TextStreamer(tokenizer)
_ = model.generate(**inputs, streamer = text_streamer, max_new_tokens = 128)
```

#### 实测结果（II）

```text
<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Continue the fibonacci sequence.

### Input:
1, 1, 2, 3, 5, 8

### Response:
11, 18, 29, 47, 76, 123<|end_of_text|>
```

**说明：** 同题第二次采样不一定相同（生成有随机性）。这次 `11, 18, 29...` 并不是标准斐波那契续写，属于 **60 steps 短训下的不稳定输出**，不代表整条链路失败。以 11.1 的正确续写为主证据即可。

---

## 12. 章节 J · 保存 LoRA 适配器

**目的：** 把训好的「小补丁」存到 `/kaggle/working/llama_lora`，之后可 Download 到本机。

```python
model.save_pretrained("llama_lora")  # Local saving
tokenizer.save_pretrained("llama_lora")
# model.push_to_hub("your_name/llama_lora", token = "YOUR_HF_TOKEN") # Online saving
# tokenizer.push_to_hub("your_name/llama_lora", token = "YOUR_HF_TOKEN") # Online saving
```

#### 实测结果（你本轮）

单元格最后返回值（来自 `tokenizer.save_pretrained` 的返回元组）：

```text
('llama_lora/tokenizer_config.json',
 'llama_lora/special_tokens_map.json',
 'llama_lora/tokenizer.json')
```

**怎么读：** 这只是 tokenizer 文件列表；**LoRA 权重文件也会写在同目录**，不一定出现在这个返回值里。

#### 目录确认（你已截图 · 2026-07-29）

Kaggle 右侧 **Output → `/kaggle/working/llama_lora/`** 已包含：

| 文件 | 含义 |
|------|------|
| **`adapter_model.safetensors`** | **适配器权重（要找的就是它）** |
| `adapter_config.json` | LoRA 配置 |
| `tokenizer.json` 等 | 分词器 |
| `README.md` | 说明 |

另外还有：`/kaggle/working/outputs/checkpoint-60/`（可查最终 loss，见下方「怎么找 loss」）。

保存后可 Download 整夹到本机：`zero-ai-study/outputs/llama_lora/`（已 gitignore，别提交大文件）。

#### 怎么找大概最终 loss（两处任选）

**方法 A（最快）：** 回到跑 `trainer.train()` 的那一格输出，看最后几行里类似：

```text
{'loss': 0.xx, 'learning_rate': ..., 'epoch': ...}
```

里面最后一次的 `loss` 就是大概最终 loss。

**方法 B（从文件读）：** 在 Output 里打开  

`/kaggle/working/outputs/checkpoint-60/trainer_state.json`  

搜索 `"log_history"`，看**最后一条**里的 `"loss"`。  
也可以在 Notebook 新建一格跑：

```python
import json
from pathlib import Path
p = Path("outputs/checkpoint-60/trainer_state.json")
state = json.loads(p.read_text())
losses = [x["loss"] for x in state.get("log_history", []) if "loss" in x]
print("steps with loss:", len(losses))
print("last loss:", losses[-1] if losses else "not found")
print("min loss:", min(losses) if losses else "not found")
```

把打印出的 `last loss` 填到前端和第 10.3 / `finetune_run_log.md` 即可。  
**不用把权重文件发给我**；发一个 loss 数字就够。

---

## 13. 章节 K · 可选：重新加载适配器再推理

`if False:` 表示**默认不执行**那段「重新 from_pretrained」。  
下面巴黎铁塔那格**没有包在 `if False` 里**，所以会用**当前内存里已微调的 model** 直接推理——这就是你有输出的原因。

```python
if False:
    from unsloth import FastLanguageModel
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = "llama_lora", # YOUR MODEL YOU USED FOR TRAINING
        max_seq_length = max_seq_length,
        dtype = dtype,
        load_in_4bit = load_in_4bit,
    )
    FastLanguageModel.for_inference(model) # Enable native 2x faster inference

# alpaca_prompt = You MUST copy from above!

inputs = tokenizer(
[
    alpaca_prompt.format(
        "What is a famous tall tower in Paris?", # instruction
        "", # input
        "", # output - leave this blank for generation!
    )
], return_tensors = "pt").to("cuda")

from transformers import TextStreamer
text_streamer = TextStreamer(tokenizer)
_ = model.generate(**inputs, streamer = text_streamer, max_new_tokens = 128)
```

#### 实测结果（巴黎铁塔）

```text
<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
What is a famous tall tower in Paris?

### Input:


### Response:
One of the most famous and iconic tall towers in Paris is the Eiffel Tower. Standing at 324 meters (1,063 feet) tall, this wrought iron tower is a symbol of the city and a must-see attraction for tourists from all over the world.<|end_of_text|>
```

**说明：** 回答正确（埃菲尔铁塔），说明指令跟随正常。

```python
if False:
    # I highly do NOT suggest - use Unsloth if possible
    from peft import AutoPeftModelForCausalLM
    from transformers import AutoTokenizer
    model = AutoPeftModelForCausalLM.from_pretrained(
        "llama_lora", # YOUR MODEL YOU USED FOR TRAINING
        load_in_4bit = load_in_4bit,
    )
    tokenizer = AutoTokenizer.from_pretrained("llama_lora")
```

#### 这一格为什么没结果？

整格都在 `if False:` 里面 → **一行都不会执行** → 没有打印、没有返回值，属于正常现象，不是报错。

---

## 14. 章节 L · 可选：合并权重 / 导出 GGUF（先别做）

这些都是 `if False`，属于 **Step 5 导出** 范围。

### 为什么你执行了却没有任何结果显示？

因为每一行实质逻辑都写成了：

```python
if False: model.save_pretrained_merged(...)
if False: model.push_to_hub_gguf(...)
```

在 Python 里，`if False:` 后面的语句**永远不跑**。  
所以你点 ▶ 时：

- 单元格会显示「已执行」  
- 但**不会保存合并模型、不会导出 GGUF、也不会有输出**  

这是官方 Notebook 的「可选开关」写法：默认关掉，避免一不小心导出很久/占满磁盘。  
**现在不要改成 `True`**；等 Step 5 再专门做。

```python
# Merge to 16bit
if False: model.save_pretrained_merged("llama_finetune_16bit", tokenizer, save_method = "merged_16bit",)
if False: model.push_to_hub_merged("HF_USERNAME/llama_finetune_16bit", tokenizer, save_method = "merged_16bit", token = "YOUR_HF_TOKEN")

# Merge to 4bit
if False: model.save_pretrained_merged("llama_finetune_4bit", tokenizer, save_method = "merged_4bit",)
if False: model.push_to_hub_merged("HF_USERNAME/llama_finetune_4bit", tokenizer, save_method = "merged_4bit", token = "YOUR_HF_TOKEN")

# Just LoRA adapters
if False:
    model.save_pretrained("llama_lora")
    tokenizer.save_pretrained("llama_lora")
if False:
    model.push_to_hub("HF_USERNAME/llama_lora", token = "YOUR_HF_TOKEN")
    tokenizer.push_to_hub("HF_USERNAME/llama_lora", token = "YOUR_HF_TOKEN")
```

```python
# Save to 8bit Q8_0
if False: model.save_pretrained_gguf("llama_finetune", tokenizer,)
# Remember to go to https://huggingface.co/settings/tokens for a token!
# And change hf to your username!
if False: model.push_to_hub_gguf("HF_USERNAME/llama_finetune", tokenizer, token = "YOUR_HF_TOKEN")

# Save to 16bit GGUF
if False: model.save_pretrained_gguf("llama_finetune", tokenizer, quantization_method = "f16")
if False: model.push_to_hub_gguf("HF_USERNAME/llama_finetune", tokenizer, quantization_method = "f16", token = "YOUR_HF_TOKEN")

# Save to q4_k_m GGUF
if False: model.save_pretrained_gguf("llama_finetune", tokenizer, quantization_method = "q4_k_m")
if False: model.push_to_hub_gguf("HF_USERNAME/llama_finetune", tokenizer, quantization_method = "q4_k_m", token = "YOUR_HF_TOKEN")

# Save to multiple GGUF options - much faster if you want multiple!
if False:
    model.push_to_hub_gguf(
        "HF_USERNAME/llama_finetune", # Change hf to your username!
        tokenizer,
        quantization_method = ["q4_k_m", "q8_0", "q5_k_m",],
        token = "YOUR_HF_TOKEN",
    )
```

#### 实测结果（章节 L）

```text
（无输出 — 全部 if False，未实际执行导出）
```

---

## 15. 你本轮踩坑速查

| 坑 | 处理 |
|----|------|
| 找不到 Internet | 顶栏 **Settings**，不在右侧 Input |
| 空的 `zero-notebook` | 要用官方 Unsloth 本 Copy and Edit |
| `login(token=...)` Note | 只设 `HF_TOKEN` 环境变量即可 |
| `additional_chat_templates` 404 | `transformers==4.57.1` + 重启，不要装到 5.14 |
| Unsloth 与 transformers 冲突 | 遵守 Unsloth 要求：`<=5.5.0` 且避开黑名单小版本 |
| `patched 32 layers...` | **成功信息**，不是报错 |

---

## 16. 接下来怎么 step by step（按这个顺序）

### 现在立刻（收尾 Step 3 前半）

1. 若还没保存适配器 → 跑 **章节 J** 的 `save_pretrained("llama_lora")`  
2. 打开前端 http://localhost:5173/finetune ，勾选并保存：  
   - `max_steps=60`  
   - Run All / 训练已跑通  
   - 模型名：`unsloth/Llama-3.1-8B-bnb-4bit`  
   - 填上大概最终 loss  
3. 填写本机 `03-finetune/finetune_run_log.md`（日期、GPU、模型、steps、loss、坑）

### 下一小步（Step 3 后半 · 换成自己的数据）

4. 把本机 `datasets/sample_alpaca_zh.jsonl` Upload 到 Kaggle（或做成 Dataset 挂到 Input）  
5. 把 `load_dataset("unsloth/alpaca-cleaned"...)` 改成读你的 jsonl  
6. 再训一小段（例如仍 60～200 steps）  
7. 再保存一份适配器（如 `llama_lora_zh`）并 Download 到 `zero-ai-study/outputs/`

### 再往后

8. **Step 4 评估**：固定几道中文题，对比「训前 / 训后」回答，写 `04-eval`  
9. **Step 5 导出**：需要时再打开章节 L 的 GGUF / merge（现在先别动）

---

## 17. 完成标准对照（自评）

- [x] GPU T4 + Internet + HF Token  
- [x] Unsloth 环境可 import  
- [x] 4bit 模型加载成功  
- [x] LoRA 挂载成功（patched 32 layers）  
- [x] `max_steps=60` 训练跑完（约 5.86 分钟；峰值约 7.275 GB）  
- [x] 推理斐波那契（I）结果合理；流式（II）另一次采样不稳定可接受  
- [x] 保存 `llama_lora`（已确认有 `adapter_model.safetensors`）  
- [x] 额外推理：巴黎铁塔回答正确  
- [ ] 从前端/`finetune_run_log` 补上最终 loss（见章节 J「怎么找 loss」）  
- [ ] Download `llama_lora` 到本机 `outputs/`  
- [ ] 换成自己的 `sample_alpaca_zh.jsonl` 再训一轮  
- [ ] 章节 L 导出 GGUF / merge（Step 5 再做；现在 `if False` 无输出是正常的）  

---

**结论：** 你已经完成一次完整的「公开数据云端 QLoRA 微调通路」；接下来不是再盲跑官方本，而是**保存产物 → 记日志 → 换自己的中文数据再训一轮**。  
做完第 1～3 项回我，我带你改 `load_dataset` 读自己的 jsonl。
