from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    HparamsChecklist,
    HparamsConfirmRequest,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    path = settings.study_root / "data" / "hparams_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "07-hparams" / "hparams_notes.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_checklist() -> HparamsChecklist:
    path = _path()
    defaults = HparamsChecklist().model_dump()
    raw = dict(defaults)
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    for key in (
        "why_r_alpha",
        "why_lr_steps_batch",
        "why_seq_quant",
        "v2_change_plan",
        "interview_talk",
        "note",
    ):
        if not (raw.get(key) or "").strip():
            raw[key] = defaults.get(key, "")
    return HparamsChecklist.model_validate(raw)


def _evaluate(body: HparamsConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.read_param_guide,
        body.explained_lora_r_alpha,
        body.explained_lr_steps_batch,
        body.explained_seq_quant,
        body.planned_v2_config,
        body.wrote_interview_answers,
    ]
    for key, label in (
        ("why_r_alpha", "r / alpha 解释"),
        ("why_lr_steps_batch", "lr / steps / batch 解释"),
        ("why_seq_quant", "seq / 4bit 解释"),
        ("v2_change_plan", "v2 改参计划"),
        ("interview_talk", "面试口述"),
    ):
        if not (getattr(body, key) or "").strip():
            missing.append(label)
    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 训练参数笔记",
        "",
        "> 本文件由前端「训练参数」页保存时自动同步。",
        "",
        "## v2 计划配置",
        "",
        f"- lora r：{data.get('lora_r')}",
        f"- lora_alpha：{data.get('lora_alpha')}",
        f"- learning_rate：{data.get('learning_rate')}",
        f"- max_steps：{data.get('max_steps')}",
        f"- per_device_train_batch_size：{data.get('per_device_train_batch_size')}",
        f"- gradient_accumulation_steps：{data.get('gradient_accumulation_steps')}",
        f"- max_seq_length：{data.get('max_seq_length')}",
        f"- load_in_4bit：{data.get('load_in_4bit')}",
        "",
        "## 为什么这么设",
        "",
        "### r / alpha",
        "",
        data.get("why_r_alpha") or "（未填）",
        "",
        "### lr / steps / batch",
        "",
        data.get("why_lr_steps_batch") or "（未填）",
        "",
        "### seq / 4bit",
        "",
        data.get("why_seq_quant") or "（未填）",
        "",
        "## 相对 v1 的改动计划",
        "",
        data.get("v2_change_plan") or "（未填）",
        "",
        "## 面试口述",
        "",
        data.get("interview_talk") or "（未填）",
        "",
        f"- 其他：{data.get('note') or '（无）'}",
        "",
        "## 校验",
        "",
        f"- 通过：{'是' if data.get('ok') else '否'}",
        f"- 保存：{data.get('confirmed_at') or '（无）'}",
        f"- 校验：{data.get('validated_at') or '（无）'}",
        "",
    ]
    _log_path().write_text("\n".join(lines), encoding="utf-8")


def save_checklist(body: HparamsConfirmRequest, *, validate: bool = False) -> ActionResult:
    now = datetime.now(timezone.utc).isoformat()
    ok, missing = _evaluate(body)
    data = body.model_dump()
    data["confirmed_at"] = now
    data["ok"] = ok
    if validate:
        data["validated_at"] = now
    _path().write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    _write_log(data)

    done = sum(
        1
        for x in (
            body.read_param_guide,
            body.explained_lora_r_alpha,
            body.explained_lr_steps_batch,
            body.explained_seq_quant,
            body.planned_v2_config,
            body.wrote_interview_answers,
        )
        if x
    )
    details = [f"勾选 {done}/6", "已同步 07-hparams/hparams_notes.md"]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "hparams",
            ProgressUpdate(status="done", note="参数深挖完成，见 07-hparams/hparams_notes.md"),
        )
        msg = "校验通过：Step 7 训练参数完成"
    else:
        progress_service.update_step(
            "hparams",
            ProgressUpdate(status="doing", note=f"参数深挖进行中（{done}/6）"),
        )
        msg = ("校验未通过：" + "；".join(missing)) if validate else f"已保存进度（{done}/6）"

    activity_service.log_activity(
        "hparams_validate" if validate else "hparams_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate},
    )
    return ActionResult(ok=ok if validate else True, message=msg, details=details, checked_at=now)


def validate_checklist(body: HparamsConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
