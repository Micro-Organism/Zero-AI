from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    ExportChecklist,
    ExportConfirmRequest,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    path = settings.study_root / "data" / "export_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "05-export-infer" / "export_notes.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _adapter_exists(adapter_dir: str) -> bool:
    rel = (adapter_dir or "").strip().rstrip("/")
    if not rel:
        return False
    root = settings.study_root
    candidates = [
        root / rel,
        root / "outputs" / "llama_lora_zh",
    ]
    for folder in candidates:
        weight = folder / "adapter_model.safetensors"
        if weight.exists():
            return True
    return False


def _default() -> dict:
    return ExportChecklist().model_dump()


def get_checklist() -> ExportChecklist:
    path = _path()
    raw = _default()
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    if not (raw.get("base_model") or "").strip():
        raw["base_model"] = "unsloth/Llama-3.1-8B-bnb-4bit"
    if not (raw.get("adapter_dir") or "").strip():
        raw["adapter_dir"] = "outputs/llama_lora_zh/"
    if not (raw.get("cloud_adapter_dir") or "").strip():
        raw["cloud_adapter_dir"] = "/kaggle/working/llama_lora_zh"
    return ExportChecklist.model_validate(raw)


def _evaluate(body: ExportConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.confirmed_local_adapter,
        body.reloaded_adapter,
        body.ran_reload_infer,
        body.wrote_notes,
    ]
    if not (body.base_model or "").strip():
        missing.append("基座模型名")
    if not (body.adapter_dir or "").strip():
        missing.append("本地适配器目录")
    if not (body.load_summary or "").strip():
        missing.append("加载 / 推理摘要")
    if not body.skipped_gguf and not body.did_gguf:
        missing.append("GGUF：勾选「已导出」或「本轮跳过」")
    if body.did_gguf:
        if not (body.gguf_quant or "").strip():
            missing.append("GGUF 量化类型")
        if not (body.gguf_path or "").strip():
            missing.append("GGUF 文件路径")
    if body.did_ollama and not (body.ollama_cmd or "").strip():
        missing.append("Ollama / 本机试聊命令")
    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 导出笔记",
        "",
        "> 本文件由前端「导出与推理」页保存时自动同步，请在看板填写。",
        "",
        "## LoRA",
        "",
        f"- 基座模型：{data.get('base_model') or '（未填）'}",
        f"- 适配器目录（本地）：`{data.get('adapter_dir') or '（未填）'}`",
        f"- 适配器目录（云端）：`{data.get('cloud_adapter_dir') or '（未填）'}`",
        f"- 加载命令 / Notebook 单元格摘要：",
        "",
        data.get("load_summary") or "（未填）",
        "",
        "## GGUF（可选）",
        "",
        f"- 本轮跳过：{'是' if data.get('skipped_gguf') else '否'}",
        f"- 已导出 GGUF：{'是' if data.get('did_gguf') else '否'}",
        f"- 量化类型（如 q4_k_m）：{data.get('gguf_quant') or '（未填）'}",
        f"- 文件路径：{data.get('gguf_path') or '（未填）'}",
        f"- 已用 Ollama / 其它工具试聊：{'是' if data.get('did_ollama') else '否'}",
        f"- Ollama / 其它工具命令：",
        "",
        data.get("ollama_cmd") or "（未填）",
        "",
        "## 问题记录",
        "",
        data.get("issues") or "（无）",
        "",
        f"- 其他备注：{data.get('note') or '（无）'}",
        "",
        "## 校验状态",
        "",
        f"- 通过：{'是' if data.get('ok') else '否'}",
        f"- 最近保存：{data.get('confirmed_at') or '（无）'}",
        f"- 最近校验：{data.get('validated_at') or '（无）'}",
        "",
    ]
    _log_path().write_text("\n".join(lines), encoding="utf-8")


def save_checklist(body: ExportConfirmRequest, *, validate: bool = False) -> ActionResult:
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
            body.confirmed_local_adapter,
            body.reloaded_adapter,
            body.ran_reload_infer,
            body.wrote_notes,
        )
        if x
    )
    local_ok = _adapter_exists(body.adapter_dir)
    details = [
        f"勾选 {done}/4",
        f"本地适配器文件：{'已找到' if local_ok else '未找到（仍可先做云端重载）'}",
        "已同步 05-export-infer/export_notes.md",
    ]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "export",
            ProgressUpdate(status="done", note="导出与复现加载完成，见 05-export-infer/export_notes.md"),
        )
        msg = "校验通过：Step 5 导出与推理完成"
    else:
        progress_service.update_step(
            "export",
            ProgressUpdate(status="doing", note=f"导出进行中（{done}/4）"),
        )
        msg = (
            ("校验未通过：" + "；".join(missing))
            if validate
            else f"已保存导出进度（{done}/4），并同步 export_notes.md"
        )

    activity_service.log_activity(
        "export_validate" if validate else "export_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate, "local_adapter": local_ok},
    )
    return ActionResult(
        ok=ok if validate else True,
        message=msg,
        details=details,
        checked_at=now,
    )


def validate_checklist(body: ExportConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
