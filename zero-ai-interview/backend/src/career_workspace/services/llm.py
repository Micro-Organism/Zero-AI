import os
from time import perf_counter

import httpx

from career_workspace.core.errors import AppError
from career_workspace.models.entities import AIProviderConfig


def _authorization_headers(provider: AIProviderConfig) -> dict[str, str]:
    api_key = os.getenv(provider.api_key_env)
    if not api_key:
        raise AppError(
            400,
            "api_key_not_configured",
            f"环境变量 {provider.api_key_env} 尚未配置",
        )
    return {"Authorization": f"Bearer {api_key}"}


def test_connection(provider: AIProviderConfig) -> dict:
    started_at = perf_counter()
    url = f"{provider.base_url.rstrip('/')}/models"
    try:
        response = httpx.get(
            url,
            headers=_authorization_headers(provider),
            timeout=provider.timeout_seconds,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise AppError(
            502,
            "provider_rejected_request",
            "AI 服务拒绝了连接测试请求",
            f"HTTP {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise AppError(502, "provider_unreachable", "无法连接 AI 服务", str(exc)) from exc

    return {
        "ok": True,
        "model": provider.model,
        "endpoint": url,
        "latency_ms": round((perf_counter() - started_at) * 1000),
    }


def chat_completion(
    provider: AIProviderConfig,
    messages: list[dict[str, str]],
    *,
    response_format: dict | None = None,
) -> dict:
    payload: dict = {
        "model": provider.model,
        "messages": messages,
        "temperature": provider.temperature,
        "max_tokens": provider.max_tokens,
    }
    if response_format:
        payload["response_format"] = response_format
    try:
        response = httpx.post(
            f"{provider.base_url.rstrip('/')}/chat/completions",
            headers={**_authorization_headers(provider), "Content-Type": "application/json"},
            json=payload,
            timeout=provider.timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        raise AppError(
            502,
            "provider_rejected_request",
            "AI 服务调用失败",
            f"HTTP {exc.response.status_code}",
        ) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise AppError(502, "provider_unreachable", "AI 服务调用失败", str(exc)) from exc
