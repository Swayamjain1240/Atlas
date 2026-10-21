"""Validated request models for private AI-worker operations."""

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmbedRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    texts: list[str] = Field(min_length=1, max_length=128)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, texts: list[str]) -> list[str]:
        if any(not text.strip() for text in texts):
            raise ValueError("texts must contain non-empty strings")
        return texts


class GenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1, max_length=12000)
    system: str | None = Field(default=None, max_length=12000)

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, prompt: str) -> str:
        if not prompt.strip():
            raise ValueError("prompt must be non-empty")
        return prompt
