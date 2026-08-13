import os


os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_MINUTES", "10080")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("IMAGE_GENERATION_PROVIDER", "cloudflare")
os.environ.setdefault("CLOUDFLARE_ACCOUNT_ID", "")
os.environ.setdefault("CLOUDFLARE_API_TOKEN", "")
