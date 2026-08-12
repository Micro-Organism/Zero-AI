from __future__ import annotations

from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import ActionResult, ConceptsNotes, ProgressUpdate
from study_api.services import activity_service, progress_service


def _notes_path() -> Path:
    return settings.study_root / "01-concepts" / "notes.md"


def _parse_section(text: str, heading: str, next_headings: list[str]) -> str:
    if heading not in text:
        return ""
    part = text.split(heading, 1)[1]
    for nh in next_headings:
        if nh in part:
            part = part.split(nh, 1)[0]
            break
    return part.strip()


def get_notes() -> ConceptsNotes:
    path = _notes_path()
    if not path.exists():
        return ConceptsNotes()
    text = path.read_text(encoding="utf-8")
    return ConceptsNotes(
        pretrain_vs_finetune=_parse_section(
            text,
            "## 1. 预训练 vs 微调",
            ["## 2."],
        ),
        why_finetune=_parse_section(text, "## 2. 我为什么要微调", ["## 3."]),
        what_is_lora=_parse_section(text, "## 3. LoRA 是干什么的", ["## 4."])
        or _parse_section(text, "## 3. LoRA 在干什么", ["## 4."]),
        what_is_qlora=_parse_section(text, "## 4. QLoRA 相对 LoRA 多了什么", ["## 5."]),
        sft_fields=_parse_section(text, "## 5. SFT 数据集大致长什么样", ["## 6."]),
        scenario=_parse_section(text, "## 6. （可选）我本轮打算微调的场景", []),
    )


def render_notes(body: ConceptsNotes) -> str:
    return f"""# 概念笔记（填空）

> 用自己的话写；写错也没关系，Step 3 跑通后再回来改。
> 本文件可由前端「概念笔记」页保存生成。

## 1. 预训练 vs 微调

{body.pretrain_vs_finetune.strip() or '（待填写）'}

## 2. 我为什么要微调（而不是只写 Prompt / 只做 RAG）

{body.why_finetune.strip() or '（待填写）'}

## 3. LoRA 是干什么的

{body.what_is_lora.strip() or '（待填写）'}

## 4. QLoRA 相对 LoRA 多了什么？免费 T4/P100 为什么更合适？

{body.what_is_qlora.strip() or '（待填写）'}

## 5. SFT 数据集大致长什么样（列几个字段名即可）

{body.sft_fields.strip() or '（待填写）'}

## 6. （可选）我本轮打算微调的场景

{body.scenario.strip() or '（待填写）'}
"""


def save_notes(body: ConceptsNotes) -> ActionResult:
    path = _notes_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    content = render_notes(body)
    path.write_text(content, encoding="utf-8")

    filled = sum(
        1
        for v in [
            body.pretrain_vs_finetune,
            body.why_finetune,
            body.what_is_lora,
            body.what_is_qlora,
            body.sft_fields,
        ]
        if v and v.strip() and v.strip() != "（待填写）"
    )
    details = [
        f"已写入 {path.relative_to(settings.study_root)}",
        f"必填题已填：{filled}/5",
    ]
    ok = filled >= 5
    message = "概念笔记已保存" + ("，必填项齐全" if ok else f"（还差 {5 - filled} 项必填）")

    activity_service.log_activity(
        "concepts_saved",
        ok,
        message,
        {"filled": filled},
    )

    try:
        progress_service.update_step(
            "concepts",
            ProgressUpdate(
                status="done" if ok else "doing",
                note=message,
            ),
        )
    except Exception:
        pass

    return ActionResult(ok=True, message=message, details=details)
