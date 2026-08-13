from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    gemini_api_key: str
    mongo_uri: str
    secret_key : str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_minutes: int
    cors_origins: str = "http://localhost:5173,http://localhost:4173"
    gemini_text_model: str = "gemini-3.5-flash-lite"
    gemini_image_model: str = "gemini-3.1-flash-image"
    image_generation_provider: str = "cloudflare"
    cloudflare_account_id: str | None = None
    cloudflare_api_token: str | None = None
    cloudflare_image_model: str = "@cf/black-forest-labs/flux-1-schnell"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

settings = Settings()
