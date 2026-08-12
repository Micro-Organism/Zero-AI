from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    EngineeringChecklist,
    EngineeringConfirmRequest,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service


def _path() -> Path:
    path = settings.study_root / "data" / "engineering_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "09-engineering" / "engineering_log.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_checklist() -> EngineeringChecklist:
    path = _path()
    defaults = EngineeringChecklist().model_dump()
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
        "g1_output",
        "g2_output",
        "g3_output",
        "g4_note",
        "vs_v2_summary",
        "interview_talk",
        "note",
    ):
        if not (raw.get(key) or "").strip():
            raw[key] = defaults.get(key, "")
    return EngineeringChecklist.model_validate(raw)


def _evaluate(body: EngineeringConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.archived_v2,
        body.uploaded_v3_data,
        body.trained_v3,
        body.saved_adapter_v3,
        body.gate_g1,
        body.gate_g2,
        body.gate_g3,
        body.gate_g4,
        body.gate_g5,
    ]
    for key, label in (
        ("approx_loss", "v3 loss（真实数字）"),
        ("g1_output", "G1 产物题输出"),
        ("g2_output", "G2 Prompt 对比输出"),
        ("g3_output", "G3 QLoRA 输出"),
        ("g4_note", "G4 套话抽检"),
        ("vs_v2_summary", "相对 v2 总结"),
        ("interview_talk", "面试口述"),
    ):
        if not (getattr(body, key) or "").strip():
            missing.append(label)

    loss = (body.approx_loss or "").strip()
    if loss and ("待" in loss or loss.lower() in {"todo", "tbd", "n/a"}):
        missing.append("approx_loss 需填真实数字")

    g1 = body.g1_output or ""
    if "【粘贴" in g1 or "合格须点到" in g1 or "【学习模板" in g1:
        missing.append("G1 请换成 Kaggle 真实 Response / 判定，不要留空模板")
    # 只拦训练污染原句；允许在「判定」里讨论「已消除落地建议」
    if "落地建议：把该知识点" in g1:
        missing.append("G1 仍含原污染套话「落地建议：把该知识点…」，门禁未过")
    need_tokens = ("适配器" in g1 or "adapter" in g1.lower()) and (
        "config" in g1.lower() or "配置" in g1 or "adapter_config" in g1.lower()
    )
    # 仅当用户勾了 G1 通过时，才强制关键词（未通过可先诚实记录）
    if body.gate_g1 and g1.strip() and not need_tokens:
        missing.append("勾选 G1 通过时，正文需点到适配器权重与配置（或 adapter_config）")
    if body.gate_g1 and "落地建议：把该知识点" in g1:
        missing.append("勾选 G1 通过时不得含原污染套话")
    if body.gate_g1 and ("G1 = 未通过" in g1 or "G1=未通过" in g1 or "结论：G1 = 未通过" in g1):
        missing.append("正文已写 G1 未通过，请取消勾选 G1")
    if body.gate_g3 and ("G3 = 未通过" in (body.g3_output or "") or "结论：G3 = 未通过" in (body.g3_output or "")):
        missing.append("正文已写 G3 未通过，请取消勾选 G3")

    for key, label in (
        ("g2_output", "G2"),
        ("g3_output", "G3"),
    ):
        val = getattr(body, key) or ""
        if "【粘贴" in val:
            missing.append(f"{label} 请换成真实 Response")

    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 工程验收 v3 记录",
        "",
        "> 本文件由前端「工程验收」页保存时自动同步。",
        "",
        "## 配置",
        "",
        f"- Kaggle Dataset：`{data.get('kaggle_dataset')}`",
        f"- 本地数据：`{data.get('dataset_path')}`",
        f"- 云端提示：{data.get('cloud_data_hint') or '（无）'}",
        f"- 训练模式：{data.get('train_mode')}",
        f"- 适配器：`{data.get('adapter_name')}`",
        f"- max_steps：{data.get('max_steps')}",
        f"- approx_loss：{data.get('approx_loss') or '（未填）'}",
        f"- v2 路径：`{data.get('local_v2_path')}`",
        f"- v3 路径：`{data.get('local_v3_path')}`",
        f"- 超参：{data.get('hparams_ref') or '（无）'}",
        "",
        "## 门禁输出",
        "",
        "### G1 产物",
        "",
        data.get("g1_output") or "（未填）",
        "",
        "### G2 Prompt/LoRA/全量",
        "",
        data.get("g2_output") or "（未填）",
        "",
        "### G3 QLoRA",
        "",
        data.get("g3_output") or "（未填）",
        "",
        "### G4 套话抽检",
        "",
        data.get("g4_note") or "（未填）",
        "",
        "## 相对 v2",
        "",
        data.get("vs_v2_summary") or "（未填）",
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


def save_checklist(body: EngineeringConfirmRequest, *, validate: bool = False) -> ActionResult:
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
            body.archived_v2,
            body.uploaded_v3_data,
            body.trained_v3,
            body.saved_adapter_v3,
            body.gate_g1,
            body.gate_g2,
            body.gate_g3,
            body.gate_g4,
            body.gate_g5,
        )
        if x
    )
    details = [f"勾选 {done}/9", "已同步 09-engineering/engineering_log.md"]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "engineering",
            ProgressUpdate(status="done", note="工程验收 v3 通过，见 09-engineering/engineering_log.md"),
        )
        msg = "校验通过：Step 9 工程验收完成（G1～G5）"
    else:
        progress_service.update_step(
            "engineering",
            ProgressUpdate(status="doing", note=f"工程验收进行中（{done}/9）"),
        )
        msg = ("校验未通过：" + "；".join(missing)) if validate else f"已保存进度（{done}/9）"

    activity_service.log_activity(
        "engineering_validate" if validate else "engineering_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate},
    )
    return ActionResult(ok=ok if validate else True, message=msg, details=details, checked_at=now)


def validate_checklist(body: EngineeringConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
