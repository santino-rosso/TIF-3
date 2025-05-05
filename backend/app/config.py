from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    mongo_uri: str

    class Config:
        env_file = ".env"

settings = Settings()
