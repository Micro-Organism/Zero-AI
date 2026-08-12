from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ProgressResponse,
    ProgressUpdate,
    StepId,
    StepProgress,
)

CANONICAL_STEPS: list[dict] = [
    {"id": "setup", "title": "Step 0 · 环境与账号", "dir": "00-setup", "status": "todo", "note": ""},
    {"id": "concepts", "title": "Step 1 · 概念", "dir": "01-concepts", "status": "todo", "note": ""},
    {"id": "data", "title": "Step 2 · 数据", "dir": "02-data", "status": "todo", "note": ""},
    {"id": "finetune", "title": "Step 3 · 微调", "dir": "03-finetune", "status": "todo", "note": ""},
    {"id": "eval", "title": "Step 4 · 评估", "dir": "04-eval", "status": "todo", "note": ""},
    {"id": "export", "title": "Step 5 · 导出与推理", "dir": "05-export-infer", "status": "todo", "note": ""},
    {"id": "data_craft", "title": "Step 6 · 数据工程深挖", "dir": "06-data-craft", "status": "todo", "note": ""},
    {"id": "hparams", "title": "Step 7 · 训练参数深挖", "dir": "07-hparams", "status": "todo", "note": ""},
    {"id": "retrain", "title": "Step 8 · 再训与复评", "dir": "08-retrain", "status": "todo", "note": ""},
    {"id": "engineering", "title": "Step 9 · 工程验收 v3", "dir": "09-engineering", "status": "todo", "note": ""},
]


def _default_progress() -> dict:
    return {
        "version": 1,
        "updated_at": None,
        "steps": [dict(s) for s in CANONICAL_STEPS],
    }


def _migrate(raw: dict) -> dict:
    by_id = {s.get("id"): s for s in raw.get("steps", []) if s.get("id")}
    merged: list[dict] = []
    for canon in CANONICAL_STEPS:
        sid = canon["id"]
        if sid in by_id:
            old = by_id[sid]
            merged.append(
                {
                    **canon,
                    "status": old.get("status", "todo"),
                    "note": old.get("note", ""),
                    "title": old.get("title") or canon["title"],
                    "dir": old.get("dir") or canon["dir"],
                }
            )
        else:
            merged.append(dict(canon))
    raw["steps"] = merged
    return raw


def _ensure_file() -> Path:
    path = settings.progress_file
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(json.dumps(_default_progress(), ensure_ascii=False, indent=2), encoding="utf-8")
        return path
    raw = json.loads(path.read_text(encoding="utf-8"))
    migrated = _migrate(raw)
    if migrated.get("steps") != raw.get("steps"):
        migrated["updated_at"] = datetime.now(timezone.utc).isoformat()
        path.write_text(json.dumps(migrated, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _to_response(raw: dict) -> ProgressResponse:
    steps = [StepProgress.model_validate(s) for s in raw.get("steps", [])]
    done = sum(1 for s in steps if s.status == "done")
    total = len(steps) or 1
    return ProgressResponse(
        version=raw.get("version", 1),
        updated_at=raw.get("updated_at"),
        steps=steps,
        done_count=done,
        total_count=total,
        percent=round(done / total * 100, 1),
    )


def get_progress() -> ProgressResponse:
    path = _ensure_file()
    raw = _migrate(json.loads(path.read_text(encoding="utf-8")))
    return _to_response(raw)


def update_step(step_id: StepId, body: ProgressUpdate) -> ProgressResponse:
    path = _ensure_file()
    raw = _migrate(json.loads(path.read_text(encoding="utf-8")))
    found = False
    for step in raw.get("steps", []):
        if step.get("id") == step_id:
            step["status"] = body.status
            if body.note is not None:
                step["note"] = body.note
            found = True
            break
    if not found:
        raise KeyError(f"unknown step: {step_id}")
    raw["updated_at"] = datetime.now(timezone.utc).isoformat()
    path.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
    return _to_response(raw)
