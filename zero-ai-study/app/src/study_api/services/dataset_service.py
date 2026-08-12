from __future__ import annotations

import json
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    DatasetItem,
    DatasetResponse,
    DatasetSaveRequest,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    return settings.dataset_file


def load_dataset() -> DatasetResponse:
    path = _path()
    items: list[DatasetItem] = []
    errors: list[str] = []
    if not path.exists():
        return DatasetResponse(items=[], count=0, path=str(path.relative_to(settings.study_root)), errors=["文件不存在"])

    with path.open(encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                items.append(
                    DatasetItem(
                        instruction=str(obj.get("instruction", "")),
                        input=str(obj.get("input", "")),
                        output=str(obj.get("output", "")),
                    )
                )
            except Exception as e:
                errors.append(f"第 {i} 行解析失败: {e}")

    return DatasetResponse(
        items=items,
        count=len(items),
        path=str(path.relative_to(settings.study_root)),
        errors=errors,
    )


def validate_items(items: list[DatasetItem]) -> list[str]:
    errors: list[str] = []
    for i, it in enumerate(items, start=1):
        if not it.instruction.strip():
            errors.append(f"第 {i} 条 instruction 为空")
        if not it.output.strip():
            errors.append(f"第 {i} 条 output 为空")
        if it.input is None:
            errors.append(f"第 {i} 条 input 缺失")
    if len(items) < 8:
        errors.append(f"当前 {len(items)} 条，建议至少 8 条（原有约 5 + 自增 ≥5）")
    return errors


def save_dataset(body: DatasetSaveRequest) -> ActionResult:
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    items = body.items
    soft_errors = validate_items(items)
    hard = [e for e in soft_errors if "建议至少" not in e]

    if hard:
        activity_service.log_activity("dataset_saved", False, "数据集保存失败：格式有误", {"errors": hard[:5]})
        return ActionResult(ok=False, message="保存失败：存在格式错误", details=hard)

    with path.open("w", encoding="utf-8") as f:
        for it in items:
            f.write(
                json.dumps(
                    {
                        "instruction": it.instruction.strip(),
                        "input": (it.input or "").strip(),
                        "output": it.output.strip(),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    details = [
        f"已写入 {path.relative_to(settings.study_root)}",
        f"共 {len(items)} 条",
    ]
    details.extend(soft_errors)

    ok_complete = len(items) >= 8 and not hard
    message = (
        f"数据集已保存（{len(items)} 条）"
        + ("，达到入门数量要求" if ok_complete else "，建议再补到 ≥8 条")
    )

    activity_service.log_activity(
        "dataset_saved",
        True,
        message,
        {"count": len(items), "complete": ok_complete},
    )

    try:
        progress_service.update_step(
            "data",
            ProgressUpdate(
                status="done" if ok_complete else "doing",
                note=message,
            ),
        )
    except Exception:
        pass

    return ActionResult(ok=True, message=message, details=details)
