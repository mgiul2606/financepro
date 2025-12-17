# app/models/category.py
"""Category model - USER-level for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.budget import BudgetCategory
    from app.models.financial_profile import FinancialProfile
    from app.models.ml_classification_log import MLClassificationLog
    from app.models.transaction import Transaction
    from app.models.user import User


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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key - USER level (shared across profiles)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Category information
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # HEX #RRGGBB

    # Type
    is_income: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )  # True for income categories

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )  # Cannot be deleted

    # Ordering
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="categories")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="category")
    budget_categories: Mapped[List["BudgetCategory"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan"
    )
    profile_preferences: Mapped[List["CategoryProfilePreference"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan"
    )
    ml_classification_logs_suggested: Mapped[List["MLClassificationLog"]] = relationship(
        foreign_keys="MLClassificationLog.suggested_category_id",
        back_populates="suggested_category"
    )
    ml_classification_logs_actual: Mapped[List["MLClassificationLog"]] = relationship(
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
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True
    )
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        primary_key=True
    )

    # Customization
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    custom_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    custom_color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    custom_icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="profile_preferences")
    financial_profile: Mapped["FinancialProfile"] = relationship()

    def __repr__(self) -> str:
        return f"<CategoryProfilePreference(cat={self.category_id}, profile={self.financial_profile_id})>"
