from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from study_api.core.config import settings
from study_api.core.schemas import (
    ActionResult,
    EvalChecklist,
    EvalConfirmRequest,
    EvalQuestion,
    ProgressUpdate,
)
from study_api.services import activity_service, progress_service

DEFAULT_QUESTIONS = [
    EvalQuestion(
        id="q1",
        question="用一句话说明什么是 QLoRA。",
        note="训练集内题，看是否贴中文表述",
    ),
    EvalQuestion(
        id="q2",
        question="求职时如何介绍一次微调实验？",
        note="训练集内题",
    ),
    EvalQuestion(
        id="q3",
        question="微调完成后常见产物有哪些？",
        note="建议用稍不同表述，测泛化",
    ),
    EvalQuestion(
        id="q4",
        question="Prompt 工程和微调有什么不同？",
        note="建议非原样背诵题",
    ),
    EvalQuestion(
        id="q5",
        question="为什么免费 GPU 上更常用 QLoRA？",
        note="与训练题相近但措辞不同",
    ),
]


def _path() -> Path:
    path = settings.study_root / "data" / "eval_checklist.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _log_path() -> Path:
    path = settings.study_root / "04-eval" / "eval_log.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _default() -> dict:
    return EvalChecklist(
        adapter_path="outputs/llama_lora_zh/",
        finetune_log_ref="03-finetune/finetune_run_log.md",
        questions=DEFAULT_QUESTIONS,
    ).model_dump()


def get_checklist() -> EvalChecklist:
    path = _path()
    raw = _default()
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            raw.update(saved)
        except json.JSONDecodeError:
            pass
    if not raw.get("questions"):
        raw["questions"] = [q.model_dump() for q in DEFAULT_QUESTIONS]
    if not (raw.get("adapter_path") or "").strip():
        raw["adapter_path"] = "outputs/llama_lora_zh/"
    return EvalChecklist.model_validate(raw)


def _evaluate(body: EvalConfirmRequest) -> tuple[bool, list[str]]:
    missing: list[str] = []
    flags = [
        body.prepared_questions,
        body.ran_before_infer,
        body.ran_after_infer,
        body.filled_comparison,
        body.wrote_conclusion,
    ]
    filled_q = 0
    for q in body.questions:
        if (q.question or "").strip() and (q.before or "").strip() and (q.after or "").strip():
            filled_q += 1
    if filled_q < 3:
        missing.append(f"至少填完 3 道题的前后对比（当前 {filled_q}）")
    if not (body.overall_better or "").strip():
        missing.append("总结：整体是否变好")
    if not (body.main_issues or "").strip():
        missing.append("总结：主要问题")
    if not (body.next_plan or "").strip():
        missing.append("总结：下一步打算")
    ok = all(flags) and not missing
    return ok, missing


def _write_log(data: dict) -> None:
    lines = [
        "# 评估记录",
        "",
        "> 本文件由前端「效果评估」页保存时自动同步，请在看板填写。",
        "",
        "## 实验引用",
        "",
        f"- 对应微调日志：`{data.get('finetune_log_ref') or '03-finetune/finetune_run_log.md'}`",
        f"- 适配器路径：`{data.get('adapter_path') or 'outputs/llama_lora_zh/'}`",
        "",
        "## 测试题与对比",
        "",
    ]
    for i, q in enumerate(data.get("questions") or [], start=1):
        lines.extend(
            [
                f"### Q{i}",
                "",
                f"- 问题：{q.get('question') or '（未填）'}",
                f"- 微调前：{q.get('before') or '（未填）'}",
                f"- 微调后：{q.get('after') or '（未填）'}",
                f"- 备注：{q.get('note') or '（无）'}",
                "",
            ]
        )
    lines.extend(
        [
            "## 总结",
            "",
            f"- 整体是否变好：{data.get('overall_better') or '（未填）'}",
            f"- 主要问题（幻觉 / 格式 / 过拟合 / 无变化）：{data.get('main_issues') or '（未填）'}",
            f"- 下一步打算（加数据 / 加 steps / 换模型 / 导出 GGUF）：{data.get('next_plan') or '（未填）'}",
            f"- 其他备注：{data.get('note') or '（无）'}",
            "",
            "## 校验状态",
            "",
            f"- 通过：{'是' if data.get('ok') else '否'}",
            f"- 最近保存：{data.get('confirmed_at') or '（无）'}",
            f"- 最近校验：{data.get('validated_at') or '（无）'}",
            "",
        ]
    )
    _log_path().write_text("\n".join(lines), encoding="utf-8")


def save_checklist(body: EvalConfirmRequest, *, validate: bool = False) -> ActionResult:
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
            body.prepared_questions,
            body.ran_before_infer,
            body.ran_after_infer,
            body.filled_comparison,
            body.wrote_conclusion,
        )
        if x
    )
    details = [
        f"勾选 {done}/5",
        f"题目数 {len(body.questions)}",
        "已同步 04-eval/eval_log.md",
    ]
    if missing:
        details.append("缺：" + "、".join(missing))

    if ok:
        progress_service.update_step(
            "eval",
            ProgressUpdate(status="done", note="评估对比已完成，见 04-eval/eval_log.md"),
        )
        msg = "校验通过：Step 4 评估完成"
    else:
        progress_service.update_step(
            "eval",
            ProgressUpdate(status="doing", note=f"评估进行中（{done}/5）"),
        )
        msg = (
            ("校验未通过：" + "；".join(missing))
            if validate
            else f"已保存评估进度（{done}/5），并同步 eval_log.md"
        )

    activity_service.log_activity(
        "eval_validate" if validate else "eval_checklist",
        ok if validate else done > 0,
        msg,
        meta={"done": done, "ok": ok, "validate": validate},
    )
    return ActionResult(
        ok=ok if validate else True,
        message=msg,
        details=details,
        checked_at=now,
    )


def validate_checklist(body: EvalConfirmRequest) -> ActionResult:
    return save_checklist(body, validate=True)
