from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

from study_api.core.config import settings
from study_api.core.schemas import ActionResult, ProgressUpdate, TokenStatus, TokenTestResult
from study_api.services import activity_service, progress_service


def mask_token(token: str) -> str:
    token = token.strip()
    if len(token) < 12:
        return "***"
    return f"{token[:8]}…{token[-4:]}"


def read_token_from_env_file() -> str | None:
    env_file = settings.study_root / ".env"
    if not env_file.exists():
        return None
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if line.startswith("HF_TOKEN="):
            value = line.split("=", 1)[1].strip().strip('"').strip("'")
            if value and "xxxx" not in value:
                return value
    return None


def resolve_token(override: str | None = None) -> str | None:
    if override and override.strip():
        return override.strip()
    return (
        os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        or read_token_from_env_file()
    )


def get_token_status() -> TokenStatus:
    token = resolve_token()
    configured = bool(token and token.startswith("hf_") and "xxxx" not in token)
    env_file = settings.study_root / ".env"
    return TokenStatus(
        configured=configured,
        masked=mask_token(token) if configured and token else None,
        source="env_file" if read_token_from_env_file() else ("process_env" if configured else None),
        env_file_exists=env_file.exists(),
        env_file_path=str(env_file.relative_to(settings.study_root)) if env_file.exists() else ".env",
    )


def save_token(token: str) -> ActionResult:
    token = token.strip()
    details: list[str] = []
    if not token.startswith("hf_"):
        return ActionResult(ok=False, message="Token 格式不正确，应以 hf_ 开头", details=details)
    if "xxxx" in token or len(token) < 20:
        return ActionResult(ok=False, message="Token 看起来像占位符或过短", details=details)

    env_path = settings.study_root / ".env"
    example = settings.study_root / ".env.example"
    if env_path.exists():
        lines = env_path.read_text(encoding="utf-8").splitlines()
    elif example.exists():
        lines = example.read_text(encoding="utf-8").splitlines()
    else:
        lines = ["HF_TOKEN=", "EXPERIMENT_NAME=zero-ai-study-sft-demo"]

    replaced = False
    new_lines: list[str] = []
    for line in lines:
        if line.startswith("HF_TOKEN="):
            new_lines.append(f"HF_TOKEN={token}")
            replaced = True
        else:
            new_lines.append(line)
    if not replaced:
        new_lines.insert(0, f"HF_TOKEN={token}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    os.environ["HF_TOKEN"] = token
    details.append(f"已写入 {env_path.name}")
    details.append(f"脱敏显示：{mask_token(token)}")
    details.append("该文件在 .gitignore 中，请勿提交到 Git")

    activity_service.log_activity(
        "token_saved",
        True,
        "已保存 HF Token 到 .env",
        {"masked": mask_token(token)},
    )
    try:
        progress_service.update_step(
            "setup",
            ProgressUpdate(status="doing", note="已写入 HF Token，待测试连通性"),
        )
    except Exception:
        pass

    return ActionResult(ok=True, message="Token 已保存到本地 .env", details=details)


def test_token(override: str | None = None) -> TokenTestResult:
    token = resolve_token(override)
    details: list[str] = []
    if not token:
        result = TokenTestResult(
            ok=False,
            message="未找到 Token：请先保存到 .env 或在测试框中粘贴",
            details=["可在「准备工作」页保存 Token"],
            masked=None,
            username=None,
            raw_keys=[],
        )
        activity_service.log_activity("token_tested", False, result.message)
        return result

    if not token.startswith("hf_"):
        result = TokenTestResult(
            ok=False,
            message="Token 格式不正确，应以 hf_ 开头",
            details=[],
            masked=mask_token(token),
            username=None,
            raw_keys=[],
        )
        activity_service.log_activity("token_tested", False, result.message, {"masked": result.masked})
        return result

    masked = mask_token(token)
    details.append(f"使用 Token：{masked}")
    details.append("请求：GET https://huggingface.co/api/whoami-v2")

    req = urllib.request.Request(
        "https://huggingface.co/api/whoami-v2",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "zero-ai-study/0.1",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload: dict[str, Any] = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:200]
        msg = f"HF 拒绝访问：HTTP {e.code}"
        details.append(body or e.reason)
        if e.code in (401, 403):
            details.append("请检查 Token 是否有效、是否被撤销，以及是否有 Read 权限")
        result = TokenTestResult(
            ok=False,
            message=msg,
            details=details,
            masked=masked,
            username=None,
            raw_keys=[],
        )
        activity_service.log_activity("token_tested", False, msg, {"masked": masked, "http": e.code})
        return result
    except Exception as e:
        msg = f"网络请求失败：{type(e).__name__}"
        details.append(str(e))
        details.append("若在公司网络，可能需代理才能访问 huggingface.co")
        result = TokenTestResult(
            ok=False,
            message=msg,
            details=details,
            masked=masked,
            username=None,
            raw_keys=[],
        )
        activity_service.log_activity("token_tested", False, msg, {"masked": masked})
        return result

    username = payload.get("name") or (payload.get("fullname") or {}).get("name")
    auth_type = None
    auth = payload.get("auth")
    if isinstance(auth, dict):
        auth_type = auth.get("type")
        access = auth.get("accessToken") or {}
        if isinstance(access, dict) and access.get("role"):
            details.append(f"Token 角色：{access.get('role')}")
    if auth_type:
        details.append(f"认证类型：{auth_type}")
    if username:
        details.append(f"HF 用户：{username}")
    details.append("连通性正常，可用于下载模型 / 数据集")

    try:
        progress_service.update_step(
            "setup",
            ProgressUpdate(
                status="doing",
                note=f"HF Token 测试通过（{username or masked}）",
            ),
        )
    except Exception:
        pass

    activity_service.log_activity(
        "token_tested",
        True,
        f"HF Token 测试通过：{username or masked}",
        {"masked": masked, "username": username},
    )

    return TokenTestResult(
        ok=True,
        message=f"Token 有效{f'，用户 {username}' if username else ''}",
        details=details,
        masked=masked,
        username=username,
        raw_keys=sorted(list(payload.keys()))[:12],
    )


_SAFE_TOKEN = re.compile(r"^hf_[A-Za-z0-9]+$")


def is_safe_token_shape(token: str) -> bool:
    return bool(_SAFE_TOKEN.match(token.strip()))
