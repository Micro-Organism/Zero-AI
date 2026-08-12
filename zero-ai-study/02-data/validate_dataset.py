#!/usr/bin/env python3
"""校验 datasets/sample_alpaca_zh.jsonl 格式。"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets" / "sample_alpaca_zh.jsonl"
REQUIRED = ("instruction", "input", "output")


def main() -> int:
    if not DATA.exists():
        print(f"[!] 找不到 {DATA}")
        return 1

    n = 0
    with DATA.open(encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"[!] 第 {i} 行 JSON 无效: {e}")
                return 1
            for k in REQUIRED:
                if k not in obj:
                    print(f"[!] 第 {i} 行缺少字段: {k}")
                    return 1
                if not isinstance(obj[k], str):
                    print(f"[!] 第 {i} 行字段 {k} 必须是字符串")
                    return 1
            if not obj["instruction"].strip() or not obj["output"].strip():
                print(f"[!] 第 {i} 行 instruction/output 不能为空")
                return 1
            n += 1

    print(f"[ok] {DATA.name}: {n} 条有效样本")
    if n < 8:
        print("[!] 建议至少 8 条（仓库样例约 5 条 + 你自增 ≥5 条）——可先用现有条数练手")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
