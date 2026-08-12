from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import ActionResult, FinetuneChecklist, FinetuneConfirmRequest, ProgressUpdate
from study_api.services import activity_service, progress_service

OFFICIAL_KAGGLE_LLAMA31 = (
    "https://www.kaggle.com/notebooks/welcome?"
    "src=https%3A%2F%2Fgithub.com%2Funslothai%2Fnotebooks%2Fblob%2Fmain%2Fnb%2F"
    "Kaggle-Llama3.1_%288B%29-Alpaca.ipynb"
)

KNOWN_DEFAULTS = {
    "opened_official_link": True,
    "copied_notebook": True,
    "gpu_t4": True,
    "internet_on": True,
    "hf_login_cell": True,
    "max_steps_60": True,
    "run_all_ok": True,
    "saved_lora": True,
    "adapter_confirmed": True,
    "date": "2026-07-29",
    "platform": "Kaggle",
    "account": "coolrabbit1993",
    "notebook_name": "zero-unsloth-llama31-8b",
    "gpu_model": "T4 x2",
    "model_name": "unsloth/Llama-3.1-8B-bnb-4bit",
    "method": "QLoRA",
    "dataset_public": "unsloth/alpaca-cleaned",
    "max_steps": "60",
    "max_seq_length": "2048",
    "approx_loss": "0.885100",
    "train_seconds": "351.3431",
    "train_minutes": "5.86",
    "peak_memory_gb": "7.275",
    "train_extra_memory_gb": "0.568",
    "cloud_lora_path": "/kaggle/working/llama_lora/",
    "local_lora_path": "outputs/llama_lora/",
    "note": "斐波那契 I 正确；流式 II 另一次采样不稳定；adapter_model.safetensors 已确认",
    "uploaded_own_jsonl": True,
    "kaggle_input_path": (
        "/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl"
    ),
}

_OLD_INPUT_PATHS = {
    "/kaggle/input/sample_alpaca_zh/sample_alpaca_zh.jsonl",
    "/kaggle/input/sample-alpaca-zh/sample_alpaca_zh.jsonl",
    "/kaggle/input/sample-alpaca-zh-01/sample_alpaca_zh.jsonl",
}


def _path() -> Path:
    path = settings.study_root / "data" / "finetune_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "03-finetune" / "finetune_run_log.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _default() -> dict:
    base = FinetuneChecklist().model_dump()
    base.update(KNOWN_DEFAULTS)
    return base


def _phase_a_flags(data: FinetuneConfirmRequest | FinetuneChecklist) -> list[bool]:
    return [
        data.opened_official_link,
        data.copied_notebook,
        data.gpu_t4,
        data.internet_on,
        data.hf_login_cell,
        data.max_steps_60,
        data.run_all_ok,
        data.saved_lora,
        data.adapter_confirmed,
    ]


def _phase_b_flags(data: FinetuneConfirmRequest | FinetuneChecklist) -> list[bool]:
    return [
        data.uploaded_own_jsonl,
        data.changed_load_dataset,
        data.retrained_own_data,
        data.saved_lora_zh,
        data.downloaded_to_local,
    ]


def _phase_a_fields_ok(data: FinetuneConfirmRequest | FinetuneChecklist) -> list[str]:
    missing: list[str] = []
    if not (data.model_name or "").strip():
        missing.append("基座模型名")
    if not (data.approx_loss or "").strip():
        missing.append("最终 loss")
    if not (data.max_steps or "").strip():
        missing.append("max_steps")
    if not (data.gpu_model or "").strip():
        missing.append("GPU 型号")
    return missing


def _phase_b_fields_ok(data: FinetuneConfirmRequest | FinetuneChecklist) -> list[str]:
    missing: list[str] = []
    if data.uploaded_own_jsonl and not (data.kaggle_input_path or "").strip():
        missing.append("Kaggle Input 路径")
    if data.retrained_own_data and not (data.own_approx_loss or "").strip():
        missing.append("自己数据训练的 loss")
    if data.retrained_own_data and not (data.own_max_steps or "").strip():
        missing.append("自己数据的 max_steps")
    return missing


def _write_run_log(data: dict) -> None:
    text = f"""# 微调实验记录

> 本文件由前端「云端微调」页保存时自动同步，请在看板填写，勿手改为主。

## 基本信息

- 日期：{data.get("date") or "（未填）"}
- 平台：{data.get("platform") or "（未填）"}
- 账号：{data.get("account") or "（未填）"}
- Notebook：{data.get("notebook_name") or "（未填）"}
- GPU 型号：{data.get("gpu_model") or "（未填）"}
- 基座模型（HF 路径）：`{data.get("model_name") or "（未填）"}`
- 方法：{data.get("method") or "（未填）"}
- 数据集（前半公开）：`{data.get("dataset_public") or "（未填）"}`
- max_steps / epochs：{data.get("max_steps") or "（未填）"}
- max_seq_length：{data.get("max_seq_length") or "（未填）"}
- 最终 train loss（大约）：{data.get("approx_loss") or "（未填）"}
- 训练耗时：{data.get("train_seconds") or "?"} s（约 {data.get("train_minutes") or "?"} 分钟）
- 峰值显存：{data.get("peak_memory_gb") or "?"} GB（训练额外约 {data.get("train_extra_memory_gb") or "?"} GB）

## 前半通路勾选

- 打开官方本：{"是" if data.get("opened_official_link") else "否"}
- Copy and Edit：{"是" if data.get("copied_notebook") else "否"}
- GPU T4 x2：{"是" if data.get("gpu_t4") else "否"}
- Internet On：{"是" if data.get("internet_on") else "否"}
- HF Token 就绪：{"是" if data.get("hf_login_cell") else "否"}
- max_steps=60：{"是" if data.get("max_steps_60") else "否"}
- 训练跑通：{"是" if data.get("run_all_ok") else "否"}
- 已保存 llama_lora：{"是" if data.get("saved_lora") else "否"}
- 已确认 adapter 权重：{"是" if data.get("adapter_confirmed") else "否"}

## 产物路径（前半）

- 云端：`{data.get("cloud_lora_path") or "（未填）"}`
- 本机：`{data.get("local_lora_path") or "（未填）"}`

## 后半 · 自己的中文数据

- 已 Upload / 挂载 jsonl：{"是" if data.get("uploaded_own_jsonl") else "否"}
- Kaggle Input 路径：`{data.get("kaggle_input_path") or "（未填）"}`
- 已改 load_dataset：{"是" if data.get("changed_load_dataset") else "否"}
- 已用自己数据再训：{"是" if data.get("retrained_own_data") else "否"}
- 自己数据 max_steps：{data.get("own_max_steps") or "（未填）"}
- 自己数据 loss：{data.get("own_approx_loss") or "（未填）"}
- 已保存 llama_lora_zh：{"是" if data.get("saved_lora_zh") else "否"}
- 云端 zh 路径：`{data.get("cloud_lora_zh_path") or "（未填）"}`
- 已下载到本机：{"是" if data.get("downloaded_to_local") else "否"}
- 本机 zh 路径：`{data.get("local_lora_zh_path") or "（未填）"}`

## 过程备注

{data.get("note") or "（无）"}

## 校验状态

- 前半通过：{"是" if data.get("phase_a_ok") else "否"}
- 后半通过：{"是" if data.get("phase_b_ok") else "否"}
- 最近保存：{data.get("confirmed_at") or "（无）"}
- 最近校验：{data.get("validated_at") or "（无）"}

## 下一步

- 前半完成后：换成自己的 `sample_alpaca_zh.jsonl` 再训并保存 `llama_lora_zh`
- 后半完成后：进入 Step 4 评估（固定中文题对比）
"""
    _log_path().write_text(text, encoding="utf-8")


def get_checklist() -> FinetuneChecklist:
    path = _path()
    raw = _default()
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    # 已知前半结果：若字段为空则回填默认，不覆盖用户已填非空值
    for key, value in KNOWN_DEFAULTS.items():
        cur = raw.get(key)
        if cur in (None, "", False) and value not in (None, ""):
            # 布尔 False 可能是用户故意取消；仅当从未确认过前半时用默认 True
            if isinstance(value, bool):
                if not raw.get("confirmed_at") and not raw.get("run_all_ok"):
                    raw[key] = value
            else:
                raw[key] = value
        if key in (
            "approx_loss",
            "model_name",
            "train_seconds",
            "train_minutes",
            "peak_memory_gb",
            "train_extra_memory_gb",
            "kaggle_input_path",
        ) and not (raw.get(key) or "").strip():
            raw[key] = value
        if key == "uploaded_own_jsonl" and not raw.get("uploaded_own_jsonl"):
            raw[key] = True
    # 纠正已知的错误短路径
    cur_path = (raw.get("kaggle_input_path") or "").strip()
    if (not cur_path) or cur_path in _OLD_INPUT_PATHS:
        raw["kaggle_input_path"] = KNOWN_DEFAULTS["kaggle_input_path"]
        raw["uploaded_own_jsonl"] = True
    return FinetuneChecklist.model_validate(raw)


def _evaluate(body: FinetuneConfirmRequest) -> tuple[bool, bool, list[str], list[str]]:
    a_flags = _phase_a_flags(body)
    b_flags = _phase_b_flags(body)
    a_missing = _phase_a_fields_ok(body)
    b_missing = _phase_b_fields_ok(body)
    phase_a_ok = all(a_flags) and not a_missing
    # 后半：勾选齐全 + 字段齐全
    phase_b_ok = all(b_flags) and not b_missing
    return phase_a_ok, phase_b_ok, a_missing, b_missing


def save_checklist(body: FinetuneConfirmRequest, *, validate: bool = False) -> ActionResult:
    path = _path()
    now = datetime.now(timezone.utc).isoformat()
    phase_a_ok, phase_b_ok, a_missing, b_missing = _evaluate(body)

    data = body.model_dump()
    data["confirmed_at"] = now
    data["phase_a_ok"] = phase_a_ok
    data["phase_b_ok"] = phase_b_ok
    if validate:
        data["validated_at"] = now

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    _write_run_log(data)

    a_done = sum(1 for x in _phase_a_flags(body) if x)
    b_done = sum(1 for x in _phase_b_flags(body) if x)
    details = [
        f"前半勾选 {a_done}/9",
        f"后半勾选 {b_done}/5",
        f"模型：{body.model_name or '（未填）'}",
        f"loss：{body.approx_loss or '（未填）'}",
        f"已同步 03-finetune/finetune_run_log.md",
    ]
    if a_missing:
        details.append("前半缺字段：" + "、".join(a_missing))
    if b_missing:
        details.append("后半缺字段：" + "、".join(b_missing))

    if phase_a_ok and phase_b_ok:
        progress_service.update_step(
            "finetune",
            ProgressUpdate(
                status="done",
                note=f"前半+后半完成；公开 loss={body.approx_loss}；自有 loss={body.own_approx_loss or '-'}",
            ),
        )
        msg = "校验通过：Step 3 前半+后半均完成，已同步实验记录"
        ok = True
    elif phase_a_ok:
        progress_service.update_step(
            "finetune",
            ProgressUpdate(
                status="doing",
                note=f"前半已完成（loss={body.approx_loss}）；后半进行中 {b_done}/5",
            ),
        )
        if validate and not phase_b_ok:
            msg = f"前半校验通过；后半未完成（{b_done}/5）" + (
                f"，缺：{'、'.join(b_missing)}" if b_missing else ""
            )
            ok = True
        else:
            msg = "已保存：前半完成，请继续后半（自己的中文数据）"
            ok = True
    else:
        progress_service.update_step(
            "finetune",
            ProgressUpdate(status="doing", note=f"微调进行中（前半 {a_done}/9，后半 {b_done}/5）"),
        )
        if validate:
            msg = "校验未通过：前半未齐" + (f"（缺 {'、'.join(a_missing)}）" if a_missing else "")
            ok = False
        else:
            msg = f"已保存进度（前半 {a_done}/9，后半 {b_done}/5），并同步实验记录"
            ok = a_done > 0 or b_done > 0

    activity_service.log_activity(
        "finetune_validate" if validate else "finetune_checklist",
        ok,
        msg,
        meta={
            "phase_a_ok": phase_a_ok,
            "phase_b_ok": phase_b_ok,
            "a_done": a_done,
            "b_done": b_done,
            "validate": validate,
        },
    )
    return ActionResult(ok=ok, message=msg, details=details, checked_at=now)


def validate_checklist(body: FinetuneConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
