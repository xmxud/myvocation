"""LLM 调用服务（OpenAI 兼容模式），支持通过 .env 的 LLM_PROVIDER 切换供应商。

支持：kimi（Moonshot）/ deepseek / qwen（DashScope 兼容模式）。
各供应商的 Key / Base URL / 模型分别通过 <PROVIDER>_API_KEY、<PROVIDER>_BASE_URL、
<PROVIDER>_MODEL 环境变量配置（qwen 的 base 变量名为 QWEN_API_BASE，兼容旧配置）。
"""
import asyncio
import json
import logging
import time
import urllib.request
import urllib.error

from app.config import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """AI 调用失败（配置缺失/网络/鉴权/响应格式异常）。"""


# 供应商注册表：name -> (显示名, api_key 配置项, base_url 配置项, model 配置项, temperature)
# 注意：kimi-k3 系列模型仅允许 temperature=1
PROVIDERS = {
    "kimi":     ("Kimi",     "kimi_api_key",     "kimi_base_url",     "kimi_model",     1.0),
    "deepseek": ("DeepSeek", "deepseek_api_key", "deepseek_base_url", "deepseek_model", 0.3),
    "qwen":     ("千问",      "qwen_api_key",     "qwen_api_base",     "qwen_model",     0.3),
}


def _resolve_provider() -> tuple[str, str, str, str, float]:
    """按 LLM_PROVIDER 解析当前供应商，返回 (显示名, api_key, base_url, model, temperature)。"""
    name = (settings.llm_provider or "qwen").strip().lower()
    if name not in PROVIDERS:
        raise LLMError(
            f"不支持的 LLM_PROVIDER '{settings.llm_provider}'，可选: {', '.join(PROVIDERS)}"
        )
    label, key_attr, base_attr, model_attr, temperature = PROVIDERS[name]
    api_key = getattr(settings, key_attr, "")
    if not api_key:
        raise LLMError(f"未配置 {key_attr.upper()}，请在 backend/.env 中设置")
    return label, api_key, getattr(settings, base_attr), getattr(settings, model_attr), temperature


def _chat_completions_sync(messages: list[dict]) -> str:
    """同步调用 chat/completions，返回 content 文本。在线程池中运行。"""
    label, api_key, base_url, model, temperature = _resolve_provider()

    url = base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": temperature,
    }
    timeout = settings.llm_timeout
    prompt_chars = sum(len(m.get("content", "")) for m in messages)
    logger.info("LLM 请求开始: provider=%s model=%s url=%s prompt=%d字符 timeout=%ds",
                label, model, url, prompt_chars, timeout)
    started = time.monotonic()
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        logger.error("LLM 请求失败: provider=%s model=%s HTTP %s 耗时%.1fs: %s",
                     label, model, e.code, time.monotonic() - started, detail)
        raise LLMError(f"{label} API 返回 {e.code}: {detail}")
    except Exception as e:
        logger.error("LLM 请求异常: provider=%s model=%s 耗时%.1fs: %s",
                     label, model, time.monotonic() - started, e)
        raise LLMError(f"{label} API 请求失败: {e}")

    elapsed = time.monotonic() - started
    usage = body.get("usage") or {}
    logger.info("LLM 请求完成: provider=%s model=%s 耗时%.1fs tokens=%s",
                label, model, elapsed, usage.get("total_tokens", "?"))

    try:
        return body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise LLMError(f"{label} API 响应格式异常: {str(body)[:300]}")


async def chat_json(messages: list[dict]) -> dict:
    """异步调用当前配置的 LLM 并解析 JSON 响应。"""
    content = await asyncio.to_thread(_chat_completions_sync, messages)
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # 兼容模型在 JSON 外包裹多余文本的情况
        start, end = content.find("{"), content.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(content[start:end + 1])
            except json.JSONDecodeError:
                pass
        raise LLMError(f"AI 返回内容不是合法 JSON: {content[:300]}")
