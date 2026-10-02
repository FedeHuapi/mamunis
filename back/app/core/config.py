from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    ENTORNO: Literal["desarrollo", "produccion"] = "desarrollo"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    DATABASE_URL: str
    SECRET_KEY: str = Field(..., min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    # cloudinary://api_key:api_secret@cloud_name. Sin esto, la subida de imagenes responde 503.
    CLOUDINARY_URL: str | None = None


settings = Settings()
