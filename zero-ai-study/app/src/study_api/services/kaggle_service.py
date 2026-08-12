from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    KaggleConfirmRequest,
    KaggleSetupStatus,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service

AcceleratorChoice = Literal["gpu_t4_x2", "gpu_p100", "cpu", "none"]

RECOMMENDED = "gpu_t4_x2"

ACCEL_LABELS = {
    "gpu_t4_x2": "GPU T4 x2（推荐）",
    "gpu_p100": "GPU P100",
    "cpu": "CPU（仅写代码，不训练）",
    "none": "未选择",
}


def _status_path() -> Path:
    path = settings.study_root / "data" / "kaggle_setup.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _default() -> dict:
    return {
        "account": "coolrabbit1993",
        "notebook_name": "zero-notebook",
        "accelerator": "none",
        "phone_verified": False,
        "gpu_selected": False,
        "secret_hf_token": False,
        "confirmed_at": None,
        "recommended": RECOMMENDED,
        "note": "",
    }


def get_status() -> KaggleSetupStatus:
    path = _status_path()
    raw = _default()
    if path.exists():
        try:
            raw.update(json.loads(path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            pass
    raw["recommended"] = RECOMMENDED
    return KaggleSetupStatus.model_validate(raw)


def save_status(body: KaggleConfirmRequest) -> ActionResult:
    path = _status_path()
    current = _default()
    if path.exists():
        try:
            current.update(json.loads(path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            pass

    current["account"] = body.account.strip() or "coolrabbit1993"
    current["notebook_name"] = body.notebook_name.strip() or "zero-notebook"
    current["accelerator"] = body.accelerator
    current["phone_verified"] = body.phone_verified
    current["gpu_selected"] = body.accelerator in ("gpu_t4_x2", "gpu_p100")
    current["secret_hf_token"] = body.secret_hf_token
    current["note"] = (body.note or "").strip()
    current["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    current["recommended"] = RECOMMENDED

    path.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")

    details = [
        f"账号：{current['account']}",
        f"Notebook：{current['notebook_name']}",
        f"Accelerator：{ACCEL_LABELS.get(current['accelerator'], current['accelerator'])}",
        f"手机验证：{'是' if current['phone_verified'] else '否'}",
        f"Kaggle Secret HF_TOKEN：{'已添加' if current['secret_hf_token'] else '未添加'}",
    ]

    ok = bool(current["phone_verified"] and current["gpu_selected"])
    if not current["phone_verified"]:
        details.append("尚未勾选手机验证——GPU 可能仍不可用")
    if not current["gpu_selected"]:
        details.append("请选择 GPU T4 x2 或 P100（CPU 不能用于本轮微调）")
    if current["accelerator"] == RECOMMENDED:
        details.append("已选择推荐方案：GPU T4 x2")
    elif current["accelerator"] == "gpu_p100":
        details.append("已选 P100：可用，单卡更直观；T4 x2 仍为推荐首选")

    message = (
        "Kaggle GPU 环境已确认"
        if ok
        else "已保存，但校验未完全通过（请补手机验证或选择 GPU）"
    )

    activity_service.log_activity(
        "kaggle_setup",
        ok,
        message,
        {
            "accelerator": current["accelerator"],
            "account": current["account"],
            "notebook": current["notebook_name"],
        },
    )

    if ok:
        note = (
            f"Kaggle 已选 {ACCEL_LABELS.get(current['accelerator'])}；"
            f"Notebook={current['notebook_name']}"
        )
        if current["secret_hf_token"]:
            note += "；Secret HF_TOKEN 已配"
        try:
            progress_service.update_step("setup", ProgressUpdate(status="doing", note=note))
        except Exception:
            pass

    return ActionResult(ok=ok, message=message, details=details)
