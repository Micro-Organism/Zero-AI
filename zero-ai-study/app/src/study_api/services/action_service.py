from __future__ import annotations

import json
import os
import sys

from study_api.core.config import settings
from study_api.core.schemas import ActionResult, ArtifactInfo


from study_api.services import activity_service


def check_env() -> ActionResult:
    details: list[str] = []
    ok = True

    v = sys.version_info
    py_ok = v.major == 3 and v.minor >= 10
    details.append(f"Python {v.major}.{v.minor}.{v.micro} {'OK' if py_ok else '建议 3.10+'}")
    ok = ok and py_ok

    details.append(f"study_root = {settings.study_root}")
    details.append(f"progress_file exists = {settings.progress_file.exists()}")

    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    env_file = settings.study_root / ".env"
    if not token and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("HF_TOKEN=") and "xxxx" not in line:
                token = line.split("=", 1)[1].strip()
                break

    if token and token.startswith("hf_") and "xxxx" not in token:
        details.append(f"HF_TOKEN 已配置（长度 {len(token)}，脱敏 {token[:8]}…{token[-4:]}）")
    else:
        details.append("HF_TOKEN 未配置或仍为占位符（可稍后配置）")
        ok = False

    for rel in ("datasets", "outputs", "00-setup", "03-finetune"):
        p = settings.study_root / rel
        details.append(f"目录 {rel}/ {'存在' if p.exists() else '缺失'}")
        if not p.exists():
            ok = False

    result = ActionResult(
        ok=ok,
        message="环境检查通过" if ok else "环境检查有待完善项（仍可继续学习概念/数据步骤）",
        details=details,
    )
    activity_service.log_activity("env_checked", result.ok, result.message)
    return result


def validate_dataset() -> ActionResult:
    path = settings.dataset_file
    details: list[str] = []
    if not path.exists():
        return ActionResult(ok=False, message=f"找不到数据集: {path}", details=[])

    required = ("instruction", "input", "output")
    n = 0
    try:
        with path.open(encoding="utf-8") as f:
            for i, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                for k in required:
                    if k not in obj or not isinstance(obj[k], str):
                        return ActionResult(
                            ok=False,
                            message=f"第 {i} 行字段无效: {k}",
                            details=details,
                        )
                if not obj["instruction"].strip() or not obj["output"].strip():
                    return ActionResult(
                        ok=False,
                        message=f"第 {i} 行 instruction/output 不能为空",
                        details=details,
                    )
                n += 1
    except json.JSONDecodeError as e:
        return ActionResult(ok=False, message=f"JSON 解析失败: {e}", details=details)

    details.append(f"文件: {path.name}")
    details.append(f"有效样本: {n} 条")
    if n < 8:
        details.append("建议至少 8 条（样例 + 自增 ≥5），可先用现有条数练手")

    result = ActionResult(ok=True, message=f"数据集校验通过（{n} 条）", details=details)
    activity_service.log_activity("dataset_validated", True, result.message, {"count": n})
    return result


def list_artifacts() -> list[ArtifactInfo]:
    candidates = [
        ("微调实验日志", "03-finetune/finetune_run_log.md"),
        ("评估日志", "04-eval/eval_log.md"),
        ("导出笔记", "05-export-infer/export_notes.md"),
        ("数据工程笔记", "06-data-craft/data_craft_notes.md"),
        ("参数笔记", "07-hparams/hparams_notes.md"),
        ("再训日志", "08-retrain/retrain_log.md"),
        ("工程验收日志", "09-engineering/engineering_log.md"),
        ("概念笔记", "01-concepts/notes.md"),
        ("样例数据集", "datasets/sample_alpaca_zh.jsonl"),
        ("v3 清洗训练集", "datasets/sample_alpaca_zh_v3.jsonl"),
        ("进度文件", "data/progress.json"),
    ]
    result: list[ArtifactInfo] = []
    for name, rel in candidates:
        p = settings.study_root / rel
        preview = None
        size = None
        if p.exists() and p.is_file():
            size = p.stat().st_size
            try:
                text = p.read_text(encoding="utf-8")
                preview = text[:400] + ("…" if len(text) > 400 else "")
            except OSError:
                preview = None
        result.append(
            ArtifactInfo(
                name=name,
                path=rel,
                exists=p.exists(),
                size=size,
                preview=preview,
            )
        )
    return result
