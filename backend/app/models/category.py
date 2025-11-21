# app/models/category.py
"""Category model - USER-level for FinancePro v2.1"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class Category(Base):
    """
    Expense/income categories shared across ALL user's profiles.

    USER-level entity (not profile-level) - single-level (no hierarchy) for simplicity.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        user_id: Category owner (USER-LEVEL)
        name: Category name
        description: Optional description
        icon: Icon name
        color: HEX color for UI
        is_income: Income flag (true for salary, invoices)
        is_active: Active flag
        is_system: System category flag (cannot be deleted)
        sort_order: Custom sort order
    """
    __tablename__ = "categories"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - USER level (shared across profiles)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Category information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)  # HEX #RRGGBB

    # Type
    is_income = Column(Boolean, default=False, nullable=False)  # True for income categories

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)  # Cannot be deleted

    # Ordering
    sort_order = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budget_categories = relationship("BudgetCategory", back_populates="category", cascade="all, delete-orphan")
    profile_preferences = relationship("CategoryProfilePreference", back_populates="category", cascade="all, delete-orphan")
    ml_classification_logs_suggested = relationship(
        "MLClassificationLog",
        foreign_keys="MLClassificationLog.suggested_category_id",
        back_populates="suggested_category"
    )
    ml_classification_logs_actual = relationship(
        "MLClassificationLog",
        foreign_keys="MLClassificationLog.actual_category_id",
        back_populates="actual_category"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}', income={self.is_income})>"


class CategoryProfilePreference(Base):
    """
    Optional per-profile customization of categories.

    Enables hiding business categories in personal profile, custom naming, etc.

    Attributes:
        category_id: Category to customize
        financial_profile_id: Target profile
        is_visible: Visibility in this profile
        custom_name: Override category name
        custom_color: Override color
        custom_icon: Override icon
    """
    __tablename__ = "category_profile_preferences"

    # Composite primary key
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        primary_key=True
    )

    # Customization
    is_visible = Column(Boolean, default=True, nullable=False)
    custom_name = Column(String(100), nullable=True)
    custom_color = Column(String(7), nullable=True)
    custom_icon = Column(String(50), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    category = relationship("Category", back_populates="profile_preferences")
    financial_profile = relationship("FinancialProfile")

    def __repr__(self) -> str:
        return f"<CategoryProfilePreference(cat={self.category_id}, profile={self.financial_profile_id})>"