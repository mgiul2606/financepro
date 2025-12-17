# backend/app/db/database.py
"""
Database configuration for FinancePro v2.1.

Uses SQLAlchemy 2.0 style with DeclarativeBase.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create engine with proper pool configuration
engine = create_engine(
    settings.database.url,
    pool_pre_ping=True,
    echo=settings.database.echo,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    pool_recycle=3600,
    connect_args={
        "connect_timeout": 10,
        "application_name": "financepro_backend",
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    Uses SQLAlchemy 2.0 DeclarativeBase for modern type annotations support.
    """
    pass


def get_db():
    """
    Database session dependency for FastAPI endpoints.

    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """
    Check if database connection is working.

    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False
