# Step 9 — 工程验收 / 通往满意结果

**看板：** http://localhost:5173/engineering  

## 必读文档

| 文档 | 作用 |
|------|------|
| [triage_v1_v2_v3.md](./triage_v1_v2_v3.md) | **问题总账 + 解决方案**（v1～v3 复盘） |
| [gate_suite.md](./gate_suite.md) | 固定验收题面（禁止漂浮 #下标） |
| [../08-retrain/engineering_acceptance.md](../08-retrain/engineering_acceptance.md) | 门禁定义与版本状态 |
| [../02-data/check_v4_ready.py](../02-data/check_v4_ready.py) | 开训前检查 |

## 现在不要做什么

- 不要在检查脚本未全绿时开第 4 次盲训  
- 不要为了刷 loss / 加大 r  
- 不要再用「Holdout#0」代替 Gate 原句  

## 通往满意的最短路径

1. 本机确认 v3 已留档（回滚）  
2. `python3 02-data/check_v4_ready.py` → **READY FOR TRAIN**  
3. 上传 `sample_alpaca_zh_v4.jsonl` 为 Dataset（如 `zero-ds-v4`）  
4. 干净重训 → 保存 `llama_lora_zh_v4`  
5. 按 `gate_suite.md` 每题采 2 次 → 全过则满意停手  

## 「下次一定满意吗？」

**不能口头保证 100%。**  
按 triage 文档：检查全绿 + 干净重训 + Gate 双采样，是把成功率提到工程可接受水平的做法；若仍有一题双采样失败，只补该失败簇再小步续训，而不是推倒重来。
