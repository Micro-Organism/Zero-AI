from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    DataCraftChecklist,
    DataCraftConfirmRequest,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    path = settings.study_root / "data" / "data_craft_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "06-data-craft" / "data_craft_notes.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _count_jsonl(rel: str) -> str:
    path = settings.study_root / (rel or "").strip()
    if not path.is_file():
        return ""
    n = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            n += 1
    return str(n)


def get_checklist() -> DataCraftChecklist:
    path = _path()
    defaults = DataCraftChecklist().model_dump()
    raw = dict(defaults)
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    # 空字段回填学习模板，便于不懂时先对照学习
    for key in (
        "task_scope",
        "quality_rules",
        "weak_spots_covered",
        "construction_notes",
        "interview_talk",
        "note",
    ):
        if not (raw.get(key) or "").strip():
            raw[key] = defaults.get(key, "")
    train_path = (raw.get("train_path") or defaults["train_path"]).strip()
    eval_path = (raw.get("eval_path") or defaults["eval_path"]).strip()
    raw["train_path"] = train_path
    raw["eval_path"] = eval_path
    auto_train = _count_jsonl(train_path)
    auto_eval = _count_jsonl(eval_path)
    if auto_train:
        raw["train_count"] = auto_train
    if auto_eval:
        raw["eval_count"] = auto_eval
    return DataCraftChecklist.model_validate(raw)


def _evaluate(body: DataCraftConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.read_guidelines,
        body.defined_task_scope,
        body.wrote_weak_spot_samples,
        body.built_holdout_eval,
        body.cleaned_and_validated,
        body.wrote_construction_notes,
    ]
    for key, label in (
        ("task_scope", "任务范围"),
        ("quality_rules", "质量规则"),
        ("construction_notes", "构建说明"),
        ("weak_spots_covered", "弱项覆盖说明"),
        ("interview_talk", "面试口述"),
    ):
        if not (getattr(body, key) or "").strip():
            missing.append(label)
    try:
        train_n = int((body.train_count or "0").strip() or "0")
    except ValueError:
        train_n = 0
        missing.append("训练集条数（数字）")
    try:
        eval_n = int((body.eval_count or "0").strip() or "0")
    except ValueError:
        eval_n = 0
        missing.append("评测集条数（数字）")
    if train_n < 500:
        missing.append(f"训练集至少 500 条（当前 {train_n}）")
    if eval_n < 100:
        missing.append(f"Holdout 评测至少 100 条（当前 {eval_n}）")
    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 数据工程笔记",
        "",
        "> 本文件由前端「数据工程」页保存时自动同步。",
        "",
        "## 任务范围",
        "",
        data.get("task_scope") or "（未填）",
        "",
        "## 质量规则",
        "",
        data.get("quality_rules") or "（未填）",
        "",
        "## 文件与规模",
        "",
        f"- 训练集：`{data.get('train_path')}` · {data.get('train_count') or '?'} 条",
        f"- Holdout 评测：`{data.get('eval_path')}` · {data.get('eval_count') or '?'} 条",
        "",
        "## 弱项覆盖",
        "",
        data.get("weak_spots_covered") or "（未填）",
        "",
        "## 构建过程",
        "",
        data.get("construction_notes") or "（未填）",
        "",
        "## 面试口述（1 分钟）",
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


def save_checklist(body: DataCraftConfirmRequest, *, validate: bool = False) -> ActionResult:
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
            body.read_guidelines,
            body.defined_task_scope,
            body.wrote_weak_spot_samples,
            body.built_holdout_eval,
            body.cleaned_and_validated,
            body.wrote_construction_notes,
        )
        if x
    )
    details = [f"勾选 {done}/6", "已同步 06-data-craft/data_craft_notes.md"]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "data_craft",
            ProgressUpdate(status="done", note="数据工程完成，见 06-data-craft/data_craft_notes.md"),
        )
        msg = "校验通过：Step 6 数据工程完成"
    else:
        progress_service.update_step(
            "data_craft",
            ProgressUpdate(status="doing", note=f"数据工程进行中（{done}/6）"),
        )
        msg = ("校验未通过：" + "；".join(missing)) if validate else f"已保存进度（{done}/6）"

    activity_service.log_activity(
        "data_craft_validate" if validate else "data_craft_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate},
    )
    return ActionResult(ok=ok if validate else True, message=msg, details=details, checked_at=now)


def validate_checklist(body: DataCraftConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
