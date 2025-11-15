# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import List, Optional
from pydantic import Field, field_validator


class APIInfo(BaseSettings):
    """API metadata and documentation settings"""
    
    # Basic info
    name: str = "FinancePro"
    title: str = "FinancePro API"
    version: str = "1.0.0"
    api_version: str = "v1"
    
    # Descriptions
    description: str = (
        "**FinancePro** is a comprehensive personal finance management platform "
        "with AI-powered features for transaction classification, budget forecasting, "
        "and intelligent financial insights.\n\n"
        "## Features\n"
        "- Multi-account management\n"
        "- Transaction tracking with AI classification\n"
        "- Budget planning and monitoring\n"
        "- AI-powered financial insights\n"
        "- Advanced analytics and reporting\n\n"
        "## Authentication\n"
        "All endpoints (except `/auth/*`) require Bearer JWT token authentication."
    )
    
    summary: str = "Personal Finance Management API with AI capabilities"
    
    # Terms and legal
    terms_of_service: Optional[str] = "https://financepro.app/terms"
    
    # Contact info
    contact_name: str = "FinancePro Support Team"
    contact_email: str = "support@financepro.app"
    contact_url: Optional[str] = "https://financepro.app/support"
    
    # License
    license_name: str = "MIT"
    license_url: Optional[str] = "https://opensource.org/licenses/MIT"
    
    # Branding
    logo_url: Optional[str] = "https://financepro.app/assets/logo.png"
    favicon_url: Optional[str] = "https://financepro.app/assets/favicon.ico"
    
    # Documentation URLs
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    
    # Tags with descriptions (for OpenAPI grouping)
    tags_metadata: List[dict] = [
        {
            "name": "Health",
            "description": "Health check and status endpoints for monitoring"
        },
        {
            "name": "Authentication",
            "description": (
                "User authentication and authorization endpoints. "
                "Includes registration, login, token refresh, and password reset."
            ),
        },
        {
            "name": "Accounts",
            "description": (
                "Financial accounts management. Create and manage multiple accounts "
                "(checking, savings, credit cards, investments) with multi-currency support."
            ),
        },
        {
            "name": "Transactions",
            "description": (
                "Transaction tracking and management with AI-powered automatic categorization. "
                "Supports bulk import from CSV and manual entry."
            ),
        },
        {
            "name": "Categories",
            "description": (
                "Transaction categories management. Organize transactions with "
                "hierarchical categories and custom tags."
            ),
        },
        {
            "name": "Budgets",
            "description": (
                "Budget planning and monitoring. Create budgets for categories, "
                "track spending, and receive alerts when approaching limits."
            ),
        },
        {
            "name": "Analytics",
            "description": (
                "Financial analytics and insights. Get spending trends, forecasts, "
                "and AI-powered recommendations for better financial decisions."
            ),
        },
    ]
    
    @property
    def api_prefix(self) -> str:
        """Get versioned API prefix (e.g., /api/v1)"""
        return f"/api/{self.api_version}"
    
    @property
    def openapi_url(self) -> str:
        """Get OpenAPI schema URL"""
        return f"{self.api_prefix}/openapi.json"
    
    class Config:
        env_prefix = "API_"  # Prefisso per env vars: API_NAME, API_VERSION, etc.


class DatabaseSettings(BaseSettings):
    """Database configuration"""
    url: str = Field(
        default="postgresql://postgres.pklyboftzpuoqqoorgly:bpB9zmxLW95Hex5v@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
        description="PostgreSQL database URL"
    )
    echo: bool = Field(
        default=False,
        description="Enable SQLAlchemy query logging"
    )
    pool_size: int = Field(
        default=5,
        description="Database connection pool size"
    )
    max_overflow: int = Field(
        default=10,
        description="Max overflow connections beyond pool_size"
    )
    
    class Config:
        env_prefix = "DATABASE_"


class SecuritySettings(BaseSettings):
    """Security and authentication settings"""
    secret_key: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Secret key for JWT encoding (CHANGE IN PRODUCTION!)"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Password policy
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digits: bool = True
    password_require_special: bool = True
    
    class Config:
        env_prefix = "SECURITY_"


class CORSSettings(BaseSettings):
    """CORS configuration"""
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ],
        description="Allowed CORS origins"
    )
    allow_credentials: bool = True
    allow_methods: List[str] = ["*"]
    allow_headers: List[str] = ["*"]
    
    class Config:
        env_prefix = "CORS_"


class FeatureFlags(BaseSettings):
    """Feature flags for enabling/disabling features"""
    enable_ai_classification: bool = True
    enable_vector_search: bool = True
    enable_budget_forecasting: bool = True
    enable_analytics: bool = True
    enable_csv_import: bool = True
    enable_pdf_export: bool = True
    
    class Config:
        env_prefix = "FEATURE_"


class RateLimitSettings(BaseSettings):
    """Rate limiting configuration"""
    enabled: bool = True
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    
    class Config:
        env_prefix = "RATE_LIMIT_"


class Settings(BaseSettings):
    """
    Main application settings.
    Loads from environment variables and .env file.
    
    Environment variables can override defaults:
    - API_NAME="CustomName"
    - DATABASE_URL="postgresql://..."
    - SECURITY_SECRET_KEY="..."
    """
    
    # Environment
    environment: str = Field(
        default="development",
        description="Application environment: development, staging, production"
    )
    debug: bool = Field(
        default=True,
        description="Enable debug mode"
    )
    testing: bool = Field(
        default=False,
        description="Enable testing mode"
    )
    
    # Nested settings
    api: APIInfo = Field(default_factory=APIInfo)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    cors: CORSSettings = Field(default_factory=CORSSettings)
    features: FeatureFlags = Field(default_factory=FeatureFlags)
    rate_limit: RateLimitSettings = Field(default_factory=RateLimitSettings)
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # External services (future)
    openai_api_key: Optional[str] = None
    sentry_dsn: Optional[str] = None
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Ensure environment is valid"""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        # Support nested env vars: DATABASE__URL, API__VERSION, etc.
        env_nested_delimiter = "__"


# Global settings instance
settings = Settings()


# Helper functions for common access patterns
def get_api_prefix() -> str:
    """Get versioned API prefix"""
    return settings.api.api_prefix


def get_database_url() -> str:
    """Get database URL"""
    return settings.database.url


def is_feature_enabled(feature: str) -> bool:
    """Check if a feature is enabled"""
    return getattr(settings.features, f"enable_{feature}", False)