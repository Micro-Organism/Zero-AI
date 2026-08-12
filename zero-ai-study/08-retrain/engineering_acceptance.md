# 工程验收标准（相对「比 v1 好一点」）

详细问题账本见：**[../09-engineering/triage_v1_v2_v3.md](../09-engineering/triage_v1_v2_v3.md)**  
固定题面见：**[../09-engineering/gate_suite.md](../09-engineering/gate_suite.md)**

## 门禁（全部满足 + G1/G2/G3 双采样才算工程通过）

| ID | 题 | 合格标准 | 一票否决 |
|----|----|----------|----------|
| G1 | 产物清单（Gate 原句） | 必留：适配器权重、adapter_config、日志/超参、评测；可选才是 GGUF | 适配器写成可选；长套话 |
| G2 | Prompt/LoRA/全量 | 「改不改权重」分清 | 含混 |
| G3 | QLoRA ≠ 全参 4bit 更新 | 明确不等于；量化加载 + 只训 LoRA | 「可能更新全部权重」当主结论 |
| G4 | 套话抽检 | 落地建议原句=0；短垫片极少 | 旧长套话复读 |
| G5 | 可交付 | 本机可重载适配器 + 日志 | 仅 working 临时目录 |

**loss 不进门禁。**

## 当前状态

| 版本 | 状态 |
|------|------|
| v1 | 链路通 |
| v2 | 概念题好，落地建议污染 |
| v3 | G2✓ G4✓；G1✗ G3✗；loss=0.261900 |
| **v4 数据** | 已生成 `datasets/sample_alpaca_zh_v4.jsonl`（开训前跑 `02-data/check_v4_ready.py`） |

## 下一枪（满意版）策略

1. 检查脚本全绿  
2. 上传 `zero-ds-v4`  
3. **干净重训** → `llama_lora_zh_v4`（推荐，甩掉 v2 先验）  
4. `gate_suite.md` 双采样全过 → 宣布满意并停手  
