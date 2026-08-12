from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    ProgressUpdate,
    RetrainChecklist,
    RetrainConfirmRequest,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    path = settings.study_root / "data" / "retrain_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "08-retrain" / "retrain_log.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_checklist() -> RetrainChecklist:
    path = _path()
    defaults = RetrainChecklist().model_dump()
    raw = dict(defaults)
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    for key in (
        "cloud_data_hint",
        "hparams_ref",
        "weak_q_results",
        "vs_v1_summary",
        "interview_talk",
        "note",
    ):
        if not (raw.get(key) or "").strip():
            raw[key] = defaults.get(key, "")
    return RetrainChecklist.model_validate(raw)


def _evaluate(body: RetrainConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.uploaded_v2_data,
        body.applied_hparams,
        body.trained_v2,
        body.saved_adapter_v2,
        body.reevaluated_weak_qs,
        body.wrote_comparison,
    ]
    for key, label in (
        ("approx_loss", "v2 loss（真实训练结果）"),
        ("weak_q_results", "弱题复评结果"),
        ("vs_v1_summary", "相对 v1 对比"),
        ("interview_talk", "面试口述"),
    ):
        if not (getattr(body, key) or "").strip():
            missing.append(label)
    loss = (body.approx_loss or "").strip()
    if loss and ("待" in loss or loss.lower() in {"todo", "tbd", "n/a"}):
        missing.append("approx_loss 需填真实数字，不能仍是占位")
    if "实填：……" in (body.weak_q_results or "") or "实填结论：……" in (body.vs_v1_summary or ""):
        missing.append("请把弱题/对比里的「实填：……」换成真实 v2 结果")
    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 再训与复评记录",
        "",
        "> 本文件由前端「再训复评」页保存时自动同步。",
        "",
        "## 实验配置",
        "",
        f"- 数据：`{data.get('dataset_path')}`",
        f"- 适配器名：`{data.get('adapter_name')}`",
        f"- max_steps：{data.get('max_steps')}",
        f"- approx_loss：{data.get('approx_loss') or '（未填）'}",
        f"- 本地路径：`{data.get('local_adapter_path')}`",
        f"- 云端数据提示：{data.get('cloud_data_hint') or '（无）'}",
        f"- 超参引用：{data.get('hparams_ref') or '（无）'}",
        "",
        "## 弱题复评",
        "",
        data.get("weak_q_results") or "（未填）",
        "",
        "## 相对 v1",
        "",
        data.get("vs_v1_summary") or "（未填）",
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


def save_checklist(body: RetrainConfirmRequest, *, validate: bool = False) -> ActionResult:
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
            body.uploaded_v2_data,
            body.applied_hparams,
            body.trained_v2,
            body.saved_adapter_v2,
            body.reevaluated_weak_qs,
            body.wrote_comparison,
        )
        if x
    )
    details = [f"勾选 {done}/6", "已同步 08-retrain/retrain_log.md"]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "retrain",
            ProgressUpdate(status="done", note="再训复评完成，见 08-retrain/retrain_log.md"),
        )
        msg = "校验通过：Step 8 再训与复评完成"
    else:
        progress_service.update_step(
            "retrain",
            ProgressUpdate(status="doing", note=f"再训复评进行中（{done}/6）"),
        )
        msg = ("校验未通过：" + "；".join(missing)) if validate else f"已保存进度（{done}/6）"

    activity_service.log_activity(
        "retrain_validate" if validate else "retrain_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate},
    )
    return ActionResult(ok=ok if validate else True, message=msg, details=details, checked_at=now)


def validate_checklist(body: RetrainConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
