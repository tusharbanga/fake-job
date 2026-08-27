from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = ""
    mongodb_database: str = "joblens"

    jwt_secret: str = "change-me"
    jwt_expires_minutes: int = 10080

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    frontend_redirect_uri: str = "http://localhost:3000"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    max_resume_bytes: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()