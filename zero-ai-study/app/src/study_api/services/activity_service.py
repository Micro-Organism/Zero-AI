from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from study_api.core.config import settings


def activity_file() -> Path:
    path = settings.study_root / "data" / "activity.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def log_activity(action: str, ok: bool, message: str, meta: dict[str, Any] | None = None) -> dict:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "ok": ok,
        "message": message,
        "meta": meta or {},
    }
    path = activity_file()
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def list_activity(limit: int = 50) -> list[dict]:
    path = activity_file()
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    items: list[dict] = []
    for line in reversed(lines[-max(limit, 1) :]):
        line = line.strip()
        if not line:
            continue
        try:
            items.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return items[:limit]
