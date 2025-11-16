# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from datetime import datetime
import logging
import sys

from app.config import settings, get_api_prefix

# Configure logging FIRST
logging.basicConfig(
    level=settings.log_level,
    format=settings.log_format,
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

logger.info(f"Starting {settings.api.name} {settings.api.version} in {settings.environment} mode")

# Import database AFTER logging is configured
try:
    from app.db.database import engine, Base, check_database_connection
    logger.info("Database module imported successfully")
except Exception as e:
    logger.error(f"Failed to import database module: {e}")
    raise

# Test database connection
try:
    if check_database_connection():
        logger.info("Database connection successful")
    else:
        logger.warning("Database connection check failed - continuing anyway")
except Exception as e:
    logger.error(f"Database connection check error: {e}")
    # Continue anyway in development
    if not settings.is_development:
        raise

# Create tables (only for dev, use migrations in production)
try:
    if settings.is_development:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created (development mode)")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    if not settings.is_development:
        raise

# Initialize FastAPI
app = FastAPI(
    title=settings.api.title,
    version=settings.api.version,
    description=settings.api.description,
    summary=settings.api.summary,
    terms_of_service=settings.api.terms_of_service,
    contact={
        "name": settings.api.contact_name,
        "url": settings.api.contact_url,
        "email": settings.api.contact_email,
    },
    license_info={
        "name": settings.api.license_name,
        "url": settings.api.license_url,
    },
    docs_url=settings.api.docs_url,
    redoc_url=settings.api.redoc_url,
    openapi_url=settings.api.openapi_url,
    openapi_tags=settings.api.tags_metadata,
    debug=settings.debug,
)

logger.info("FastAPI application initialized")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allowed_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)
logger.info(f"CORS middleware configured with origins: {settings.cors.allowed_origins}")


def custom_openapi():
    """Custom OpenAPI schema generation"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.api.title,
        version=settings.api.version,
        description=settings.api.description,
        routes=app.routes,
        tags=settings.api.tags_metadata,
        terms_of_service=settings.api.terms_of_service,
        contact={
            "name": settings.api.contact_name,
            "url": settings.api.contact_url,
            "email": settings.api.contact_email,
        },
        license_info={
            "name": settings.api.license_name,
            "url": settings.api.license_url,
        },
    )
    
    # Add custom extensions
    if settings.api.logo_url:
        openapi_schema["info"]["x-logo"] = {
            "url": settings.api.logo_url,
            "altText": f"{settings.api.name} Logo"
        }

    # Ensure components exists
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    # Security schemes
    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": (
            f"JWT token obtained from {get_api_prefix()}/auth/login endpoint. "
            f"Token expires after {settings.security.access_token_expire_minutes} minutes."
        )
    }

    openapi_schema["security"] = [{"bearerAuth": []}]
    
    # Custom metadata
    openapi_schema["info"]["x-api-id"] = f"{settings.api.name.lower()}-api"
    openapi_schema["info"]["x-audience"] = "external"
    openapi_schema["info"]["x-environment"] = settings.environment
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"], include_in_schema=False)
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.api.name,
        "version": settings.api.version,
        "api_version": settings.api.api_version,
        "environment": settings.environment,
        "status": "running",
        "docs": settings.api.docs_url,
        "redoc": settings.api.redoc_url,
        "openapi": settings.api.openapi_url,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    # Check database
    db_healthy = check_database_connection()
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.api.name,
        "version": settings.api.version,
        "api_version": settings.api.api_version,
        "environment": settings.environment,
        "checks": {
            "database": "healthy" if db_healthy else "unhealthy"
        },
        "features": {
            "ai_classification": settings.features.enable_ai_classification,
            "vector_search": settings.features.enable_vector_search,
            "analytics": settings.features.enable_analytics,
        }
    }


@app.get("/version", tags=["Health"])
async def version_info():
    """Version information"""
    return {
        "app_name": settings.api.name,
        "app_version": settings.api.version,
        "api_version": settings.api.api_version,
        "environment": settings.environment,
        "python_version": "3.11+",
        "debug_mode": settings.debug,
    }


# ============================================================================
# ROUTERS
# ============================================================================

logger.info("Loading API routers...")

try:
    from app.api import (
        auth,
        accounts,
        categories,
        financial_profiles,
        transactions,
        budgets,
        goals
    )
    logger.info("API modules imported successfully")
except Exception as e:
    logger.error(f"Failed to import API modules: {e}")
    logger.warning("Application will start without API routers")
    auth = accounts = categories = None
    financial_profiles = transactions = budgets = goals = None

# Get API prefix
API_PREFIX = get_api_prefix()

# Register routers if available
if auth:
    app.include_router(
        auth.router,
        prefix=f"{API_PREFIX}/auth",
        tags=["Authentication"]
    )
    logger.info(f"Auth router registered at {API_PREFIX}/auth")

if financial_profiles:
    app.include_router(
        financial_profiles.router,
        prefix=f"{API_PREFIX}/profiles",
        tags=["Financial Profiles"]
    )
    logger.info(f"Financial Profiles router registered at {API_PREFIX}/profiles")

if accounts:
    app.include_router(
        accounts.router,
        prefix=f"{API_PREFIX}/accounts",
        tags=["Accounts"]
    )
    logger.info(f"Accounts router registered at {API_PREFIX}/accounts")

if categories:
    app.include_router(
        categories.router,
        prefix=f"{API_PREFIX}/categories",
        tags=["Categories"]
    )
    logger.info(f"Categories router registered at {API_PREFIX}/categories")

if transactions:
    app.include_router(
        transactions.router,
        prefix=f"{API_PREFIX}/transactions",
        tags=["Transactions"]
    )
    logger.info(f"Transactions router registered at {API_PREFIX}/transactions")

if budgets:
    app.include_router(
        budgets.router,
        prefix=f"{API_PREFIX}/budgets",
        tags=["Budgets"]
    )
    logger.info(f"Budgets router registered at {API_PREFIX}/budgets")

if goals:
    app.include_router(
        goals.router,
        prefix=f"{API_PREFIX}/goals",
        tags=["Financial Goals"]
    )
    logger.info(f"Goals router registered at {API_PREFIX}/goals")

logger.info(f"Application startup complete. API documentation: {settings.api.docs_url}")