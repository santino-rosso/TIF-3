from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    mongo_uri: str
    secret_key : str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_minutes: int

    class Config:
        env_file = ".env"

settings = Settings()
