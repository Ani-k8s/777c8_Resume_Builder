import os
import json
import httpx
import time
from typing import Optional, Tuple, Dict, Any
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import async_session_factory
from app.models import PromptCache, AICostLog, SystemSettings
from app.services.settings_service import settings_service

# Token pricing in USD per 1,000 tokens (input, output)
MODEL_PRICING = {
    "gpt-4o-mini": (0.00015, 0.0006),
    "gpt-4o": (0.005, 0.015),
    "claude-3-5-sonnet": (0.003, 0.015),
    "claude-3-haiku": (0.00025, 0.00125),
    "gemini-1.5-flash": (0.000075, 0.0003),
    "gemini-1.5-pro": (0.0035, 0.0105),
    "deepseek-chat": (0.00014, 0.00028),
    "llama3": (0.0, 0.0),
    "mistral": (0.0, 0.0),
}

class LLMEngineService:
    """Unified LLM Service supporting multiple providers, caching, failover, and cost tracking."""

    def _estimate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Estimate the API call cost based on token counts."""
        pricing = MODEL_PRICING.get(model, (0.0005, 0.0015))  # Default fallback pricing
        input_cost = (prompt_tokens / 1000.0) * pricing[0]
        output_cost = (completion_tokens / 1000.0) * pricing[1]
        return input_cost + output_cost

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        feature: str,
        response_format: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> str:
        """
        Generate text using active provider, with cache check, failover, and cost tracking.
        If db is not provided, opens a transient session.
        """
        # Calculate cache key
        cache_content = f"{feature}:{system_prompt}:{user_prompt}"
        import hashlib
        cache_key = hashlib.sha256(cache_content.encode("utf-8")).hexdigest()

        # Check Cache
        if db:
            cached = await self._check_cache(db, cache_key)
            if cached:
                logger.info(f"Cache hit for feature: {feature}")
                return cached
        else:
            async with async_session_factory() as session:
                cached = await self._check_cache(session, cache_key)
                if cached:
                    logger.info(f"Cache hit for feature: {feature}")
                    return cached

        # Fetch configurations
        if db:
            settings = await settings_service.get_settings(db)
            api_keys = await settings_service.get_api_keys(db)
        else:
            async with async_session_factory() as session:
                settings = await settings_service.get_settings(session)
                api_keys = await settings_service.get_api_keys(session)

        provider = settings.active_provider
        model = settings.active_model
        ollama_url = settings.ollama_url

        try:
            return await self._execute_generation_with_logging(
                provider, model, system_prompt, user_prompt, feature, response_format, api_keys, ollama_url, cache_key, db
            )
        except Exception as e:
            logger.error(f"Primary provider {provider} failed: {e}")
            if settings.failover_enabled:
                logger.info(f"Triggering failover to provider: {settings.failover_provider}")
                # Use default model names for failover
                failover_models = {
                    "openai": "gpt-4o-mini",
                    "anthropic": "claude-3-haiku",
                    "gemini": "gemini-1.5-flash",
                    "openrouter": "google/gemini-2.5-flash",
                    "groq": "llama3-8b-8192",
                    "deepseek": "deepseek-chat",
                    "ollama": "llama3"
                }
                failover_model = failover_models.get(settings.failover_provider, "gpt-4o-mini")
                try:
                    return await self._execute_generation_with_logging(
                        settings.failover_provider, failover_model, system_prompt, user_prompt, feature, response_format, api_keys, ollama_url, cache_key, db
                    )
                except Exception as fe:
                    logger.critical(f"Failover provider {settings.failover_provider} also failed: {fe}")
                    raise fe
            else:
                raise e

    async def _execute_generation_with_logging(
        self,
        provider: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        feature: str,
        response_format: Optional[str],
        api_keys: Dict[str, str],
        ollama_url: str,
        cache_key: str,
        db: Optional[AsyncSession]
    ) -> str:
        """Call the actual LLM API, compute costs, and save to cache & cost logs."""
        api_key = api_keys.get(provider, "")
        if not api_key and provider != "ollama":
            # Fallback to env var if DB doesn't have it (helpful for dev/local)
            env_key_names = {
                "openai": "OPENAI_API_KEY",
                "anthropic": "ANTHROPIC_API_KEY",
                "gemini": "GEMINI_API_KEY",
                "openrouter": "OPENROUTER_API_KEY",
                "groq": "GROQ_API_KEY",
                "deepseek": "DEEPSEEK_API_KEY",
            }
            api_key = os.environ.get(env_key_names.get(provider, ""), "")

        start_time = time.time()
        
        # Call provider API
        response_text, prompt_tokens, completion_tokens = await self._call_provider_api(
            provider, model, system_prompt, user_prompt, response_format, api_key, ollama_url
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        cost = self._estimate_cost(model, prompt_tokens, completion_tokens)

        # Log Cost and Cache result asynchronously or in transient session
        if db:
            await self._save_log_and_cache(db, cache_key, feature, response_text, provider, model, prompt_tokens, completion_tokens, cost)
        else:
            async with async_session_factory() as session:
                await self._save_log_and_cache(session, cache_key, feature, response_text, provider, model, prompt_tokens, completion_tokens, cost)
                await session.commit()

        # Add to Benchmark logs if we are running benchmarks
        # (will be called directly from benchmarks router)

        return response_text

    async def _check_cache(self, db: AsyncSession, cache_key: str) -> Optional[str]:
        """Check the database prompt cache."""
        result = await db.execute(select(PromptCache).where(PromptCache.cache_key == cache_key))
        cache_entry = result.scalar_one_or_none()
        if cache_entry:
            return cache_entry.response
        return None

    async def _save_log_and_cache(
        self,
        db: AsyncSession,
        cache_key: str,
        feature: str,
        response_text: str,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cost: float
    ):
        """Save API call logs to prompt cache and cost logs tables."""
        # Save cache
        cache_entry = PromptCache(
            cache_key=cache_key,
            prompt_type=feature,
            input_hash=cache_key[:64],
            response=response_text,
            tokens_used=prompt_tokens + completion_tokens,
            cost_usd=cost
        )
        db.add(cache_entry)

        # Save cost log
        cost_log = AICostLog(
            provider_name=provider,
            model_name=model,
            feature=feature,
            tokens_prompt=prompt_tokens,
            tokens_completion=completion_tokens,
            estimated_cost_usd=cost
        )
        db.add(cost_log)

    async def _call_provider_api(
        self,
        provider: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        response_format: Optional[str],
        api_key: str,
        ollama_url: str
    ) -> Tuple[str, int, int]:
        """Executes HTTP request to targeted LLM provider."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            if provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                data = {
                    "model": model,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    "temperature": 0.3
                }
                if response_format == "json":
                    data["response_format"] = {"type": "json_object"}
                
                res = await client.post(url, headers=headers, json=data)
                res.raise_for_status()
                res_json = res.json()
                content = res_json["choices"][0]["message"]["content"]
                usage = res_json.get("usage", {})
                return content, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)

            elif provider == "anthropic":
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                data = {
                    "model": model,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                    "max_tokens": 4096,
                    "temperature": 0.3
                }
                res = await client.post(url, headers=headers, json=data)
                res.raise_for_status()
                res_json = res.json()
                content = res_json["content"][0]["text"]
                usage = res_json.get("usage", {})
                return content, usage.get("input_tokens", 0), usage.get("output_tokens", 0)

            elif provider == "gemini":
                # API uses URL parameter for API key
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                
                # Combine system instructions and user prompt for Gemini compatibility if needed
                data = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": f"System Instructions:\n{system_prompt}\n\nUser Request:\n{user_prompt}"}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                    }
                }
                if response_format == "json":
                    data["generationConfig"]["responseMimeType"] = "application/json"
                    
                res = await client.post(url, headers=headers, json=data)
                res.raise_for_status()
                res_json = res.json()
                content = res_json["candidates"][0]["content"]["parts"][0]["text"]
                # Gemini usage metadata
                usage = res_json.get("usageMetadata", {})
                return content, usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0)

            elif provider in ["openrouter", "groq", "deepseek", "mistral"]:
                endpoints = {
                    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
                    "groq": "https://api.groq.com/openai/v1/chat/completions",
                    "deepseek": "https://api.deepseek.com/chat/completions",
                    "mistral": "https://api.mistral.ai/v1/chat/completions"
                }
                url = endpoints[provider]
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                data = {
                    "model": model,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    "temperature": 0.3
                }
                if response_format == "json":
                    data["response_format"] = {"type": "json_object"}
                    
                res = await client.post(url, headers=headers, json=data)
                res.raise_for_status()
                res_json = res.json()
                content = res_json["choices"][0]["message"]["content"]
                usage = res_json.get("usage", {})
                return content, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)

            elif provider == "ollama":
                url = f"{ollama_url}/v1/chat/completions"
                headers = {"Content-Type": "application/json"}
                data = {
                    "model": model,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    "temperature": 0.3
                }
                if response_format == "json":
                    data["response_format"] = {"type": "json_object"}
                    
                res = await client.post(url, headers=headers, json=data)
                res.raise_for_status()
                res_json = res.json()
                content = res_json["choices"][0]["message"]["content"]
                usage = res_json.get("usage", {})
                return content, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
                
            else:
                raise ValueError(f"Unknown or unsupported provider: {provider}")

llm_engine = LLMEngineService()
