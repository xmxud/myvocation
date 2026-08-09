"""Application configuration."""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MyVocation API"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 480
    database_path: str = "db/app.db"
    cors_origins: str = "*"

    # LLM 供应商切换：kimi / deepseek / qwen
    llm_provider: str = "qwen"
    # LLM 请求超时（秒）：长阶段生成大 JSON 时 kimi-k3 等模型可能耗时较久
    llm_timeout: int = 300

    # 千问（Qwen / DashScope 兼容模式）
    qwen_api_key: str = ""
    qwen_api_base: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-plus"

    # Kimi（Moonshot OpenAI 兼容模式）
    kimi_api_key: str = ""
    kimi_base_url: str = "https://api.moonshot.cn/v1"
    kimi_model: str = "moonshot-v1-8k"

    # DeepSeek（OpenAI 兼容模式）
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
