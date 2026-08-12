#!/usr/bin/env python3
"""本地环境快速检查：不要求本机有 GPU（训练在 Kaggle/Colab）。"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("[!] 未找到 .env —— 请先: cp .env.example .env 并填入 HF_TOKEN")
        return
    try:
        from dotenv import load_dotenv as _load

        _load(env_path)
        print("[ok] 已加载 .env")
    except ImportError:
        print("[!] 未安装 python-dotenv，跳过 .env 加载（pip install -r requirements.txt）")


def check_python() -> bool:
    v = sys.version_info
    ok = v.major == 3 and v.minor >= 10
    print(f"[{'ok' if ok else '!'}] Python {v.major}.{v.minor}.{v.micro} （建议 3.10+）")
    return ok


def check_imports() -> bool:
    mods = ["dotenv", "pandas", "datasets", "huggingface_hub"]
    missing = []
    for name in mods:
        try:
            __import__(name if name != "dotenv" else "dotenv")
            print(f"[ok] import {name}")
        except ImportError:
            missing.append(name)
            print(f"[!] 缺少 {name}")
    if missing:
        print("    → pip install -r requirements.txt")
        return False
    return True


def check_hf_token() -> bool:
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if not token:
        print("[!] 未设置 HF_TOKEN（可先空着，下载门控模型时再配）")
        return False
    if token.startswith("hf_") and "xxxx" not in token:
        print(f"[ok] HF_TOKEN 已设置（长度 {len(token)}）")
        return True
    print("[!] HF_TOKEN 仍是占位符，请改成真实 Token")
    return False


def check_dirs() -> None:
    for rel in ("datasets", "outputs", "03-finetune"):
        p = ROOT / rel
        print(f"[{'ok' if p.exists() else '!'}] 目录 {rel}/")


def main() -> int:
    print("=== zero-ai-study env check ===")
    print(f"ROOT = {ROOT}")
    load_dotenv()
    ok_py = check_python()
    ok_imp = check_imports()
    check_hf_token()
    check_dirs()
    print("---")
    print("说明：本机无 GPU 不影响学习 Step 0～2；Step 3 请到 Kaggle/Colab。")
    if ok_py and ok_imp:
        print("结果：基础检查通过，可以进入 01-concepts。")
        return 0
    print("结果：还有待修复项，请按上方提示处理。")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
