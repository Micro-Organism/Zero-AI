#!/usr/bin/env python3
"""开训前检查：sample_alpaca_zh_v4.jsonl 是否达到 Gate 就绪标准。"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
V4 = ROOT / "datasets" / "sample_alpaca_zh_v4.jsonl"

G1 = "请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。"
G3 = "判断题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？请辨析。"
PADS = (
    "交付时至少能指出",
    "工程习惯：一次只改",
    "面试表述：",
    "若线上表现与预期不符",
    "验收要点：",
    "落地建议：把该知识点",
)


def main() -> int:
    if not V4.exists():
        print(f"FAIL: missing {V4}")
        return 1
    rows = [json.loads(l) for l in V4.read_text(encoding="utf-8").splitlines() if l.strip()]
    n = len(rows)
    inst = {r["instruction"] for r in rows}
    poll = sum(1 for r in rows if "落地建议：把该知识点" in r["output"])
    pad_n = sum(1 for r in rows if any(p in r["output"] for p in PADS))
    prod_n = sum(
        1
        for r in rows
        if any(k in r["instruction"] for k in ("产物", "归档", "adapter_config", "必留", "可选"))
    )
    qlora_n = sum(
        1
        for r in rows
        if "QLoRA" in r["instruction"] and ("4bit" in r["instruction"] or "全量" in r["instruction"])
    )

    checks = [
        ("rows >= 500", n >= 500, f"n={n}"),
        ("落地建议原句 = 0", poll == 0, f"count={poll}"),
        ("短垫片命中 < 5%", pad_n / n < 0.05, f"{pad_n}/{n}"),
        ("产物相关 >= 40", prod_n >= 40, f"count={prod_n}"),
        ("QLoRA 辨析相关 >= 18", qlora_n >= 18, f"count={qlora_n}"),
        ("含 G1 原句", G1 in inst, "yes" if G1 in inst else "no"),
        ("含 G3 原句", G3 in inst, "yes" if G3 in inst else "no"),
    ]
    ok = True
    print(f"file: {V4}")
    for name, passed, detail in checks:
        status = "PASS" if passed else "FAIL"
        if not passed:
            ok = False
        print(f"  [{status}] {name} ({detail})")
    print("READY FOR TRAIN" if ok else "NOT READY — 先修数据再上 Kaggle")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
